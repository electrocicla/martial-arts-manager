#requires -Version 5.1
<#
.SYNOPSIS
  Provisions the two authorized Manzur academy leaders without exposing their passwords.
.DESCRIPTION
  Requires a reviewed D1 backup and a local operator to enter each initial password
  into a masked PowerShell prompt. No password, derived hash, or SQL containing a
  derived hash is printed or checked into Git. Do not run from automation/CI.
#>
[CmdletBinding()]
param(
  [switch]$Execute,
  [string]$Database = 'martial-arts-db'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($Database -ne 'martial-arts-db') { throw 'Only the verified martial-arts-db binding is allowed.' }

function Invoke-D1Query([string]$Sql) {
  $singleLine = ($Sql -replace '\s+', ' ').Trim()
  $output = & npx.cmd wrangler d1 execute $Database --remote --command $singleLine --json 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Wrangler D1 query failed (exit code $LASTEXITCODE)." }
  $json = $output -join [Environment]::NewLine
  $parsed = ConvertFrom-Json -InputObject $json
  foreach ($entry in @($parsed)) {
    if ($entry.success -ne $true) { throw 'Wrangler returned a failed query.' }
  }
  return ,@($parsed)
}

function New-PasswordHash([string]$AccountLabel) {
  $secret = Read-Host "Enter a temporary password for $AccountLabel (input hidden)" -AsSecureString
  if ($secret.Length -lt 12) { throw 'The temporary password must have at least 12 characters.' }
  $pointer = [IntPtr]::Zero
  $kdf = $null
  $salt = New-Object byte[] 16
  try {
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $random = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($salt) } finally { $random.Dispose() }
    $kdf = [Security.Cryptography.Rfc2898DeriveBytes]::new(
      $plain, $salt, 100000, [Security.Cryptography.HashAlgorithmName]::SHA256
    )
    $digest = $kdf.GetBytes(32)
    $saltHex = [BitConverter]::ToString($salt).Replace('-', '').ToLowerInvariant()
    $digestHex = [BitConverter]::ToString($digest).Replace('-', '').ToLowerInvariant()
    [Array]::Clear($digest, 0, $digest.Length)
    return "$saltHex" + ':' + "$digestHex"
  }
  finally {
    if ($null -ne $kdf) { $kdf.Dispose() }
    if ($pointer -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
    $secret.Dispose()
    [Array]::Clear($salt, 0, $salt.Length)
  }
}

# No DB mutation before validating the organization and baseline.
$beforeQuery = @"
SELECT
 (SELECT COUNT(*) FROM users WHERE lower(email) IN ('gaston@manzur.cl','diego@manzur.cl')) AS existing_users,
 (SELECT COUNT(*) FROM organizations WHERE id='manzur' AND is_active=1) AS organization_ok,
 (SELECT COUNT(*) FROM branches WHERE id='manzur-main' AND organization_id='manzur' AND is_active=1) AS branch_ok,
 (SELECT COUNT(*) FROM organization_memberships WHERE organization_id='hamarr') AS hamarr_memberships,
 (SELECT COUNT(*) FROM branch_staff bs JOIN branches b ON b.id=bs.branch_id WHERE b.organization_id='hamarr') AS hamarr_branch_staff,
 (SELECT COUNT(*) FROM platform_admins) AS platform_admins;
"@
$before = @(Invoke-D1Query $beforeQuery)[0].results[0]
if ($before.organization_ok -ne 1 -or $before.branch_ok -ne 1) {
  throw 'Manzur organization or main branch is unavailable.'
}
if ($before.existing_users -ne 0) {
  throw 'One or both emails already exist. Refusing to overwrite existing identities.'
}
Write-Host 'Preflight OK: no existing Gaston/Diego identities; Manzur branch active.'
if (-not $Execute) {
  Write-Host 'DRY RUN only. Use -Execute for a guarded local credential handoff.'
  return
}

$backup = @(Get-ChildItem -LiteralPath '.wrangler/backups' -Filter 'pre-manzur-staff-*.sql' -File -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1)
if ($backup.Count -ne 1 -or $backup[0].Length -lt 1024) {
  throw 'A verified pre-provisioning D1 backup must exist under .wrangler/backups.'
}

$gastonHash = New-PasswordHash 'gaston@manzur.cl'
$diegoHash = New-PasswordHash 'diego@manzur.cl'
$gastonId = [Guid]::NewGuid().ToString()
$diegoId = [Guid]::NewGuid().ToString()

# Account/global role is intentionally least privileged. The actual authority
# is an active membership scoped to Manzur, as enforced by the API.
$sql = @"
INSERT INTO users (id,email,password_hash,name,role,is_active,is_approved,created_at,updated_at,approved_at)
VALUES ('$gastonId','gaston@manzur.cl','$gastonHash','Gaston Manzur','student',1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT INTO users (id,email,password_hash,name,role,is_active,is_approved,created_at,updated_at,approved_at)
VALUES ('$diegoId','diego@manzur.cl','$diegoHash','Diego Manzur','student',1,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT INTO organization_memberships (organization_id,user_id,role,status,is_active,student_id,approved_at,created_at,updated_at)
VALUES ('manzur','$gastonId','admin','active',1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT INTO organization_memberships (organization_id,user_id,role,status,is_active,student_id,approved_at,created_at,updated_at)
VALUES ('manzur','$diegoId','instructor','active',1,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
INSERT INTO branch_staff (branch_id,user_id,created_by,created_at)
VALUES ('manzur-main','$gastonId','$gastonId',CURRENT_TIMESTAMP);
INSERT INTO branch_staff (branch_id,user_id,created_by,created_at)
VALUES ('manzur-main','$diegoId','$gastonId',CURRENT_TIMESTAMP);
"@

$tempFile = Join-Path ([IO.Path]::GetTempPath()) ("manzur-provision-" + [Guid]::NewGuid().ToString('N') + '.sql')
try {
  [IO.File]::WriteAllText($tempFile, $sql, (New-Object System.Text.UTF8Encoding($false)))
  $sql = $null
  $gastonHash = $null
  $diegoHash = $null
  # Wrangler can mix progress output with JSON when importing a file. Its exit
  # code is provisional; the exact read-only D1 postconditions below are the
  # authority for success, including tenant isolation and unchanged HAMARR data.
  $null = & npx.cmd wrangler d1 execute $Database --remote --file $tempFile --json 2>&1
  if ($LASTEXITCODE -ne 0) { throw "Wrangler D1 import failed (exit code $LASTEXITCODE)." }
}
finally {
  $sql = $null
  $gastonHash = $null
  $diegoHash = $null
  if (Test-Path -LiteralPath $tempFile) { Remove-Item -LiteralPath $tempFile -Force }
}

$after = @(Invoke-D1Query @"
SELECT
 (SELECT COUNT(*) FROM users WHERE lower(email) IN ('gaston@manzur.cl','diego@manzur.cl') AND is_active=1 AND is_approved=1) AS active_users,
 (SELECT COUNT(*) FROM organization_memberships om JOIN users u ON u.id=om.user_id WHERE om.organization_id='manzur' AND om.status='active' AND om.is_active=1 AND ((lower(u.email)='gaston@manzur.cl' AND om.role='admin') OR (lower(u.email)='diego@manzur.cl' AND om.role='instructor'))) AS correct_memberships,
 (SELECT COUNT(*) FROM branch_staff bs JOIN users u ON u.id=bs.user_id WHERE bs.branch_id='manzur-main' AND lower(u.email) IN ('gaston@manzur.cl','diego@manzur.cl')) AS staff_assignments,
 (SELECT COUNT(*) FROM organization_memberships WHERE organization_id='hamarr') AS hamarr_memberships,
 (SELECT COUNT(*) FROM branch_staff bs JOIN branches b ON b.id=bs.branch_id WHERE b.organization_id='hamarr') AS hamarr_branch_staff,
 (SELECT COUNT(*) FROM organization_memberships om JOIN users u ON u.id=om.user_id WHERE om.organization_id='hamarr' AND lower(u.email) IN ('gaston@manzur.cl','diego@manzur.cl')) AS cross_tenant_memberships,
 (SELECT COUNT(*) FROM platform_admins) AS platform_admins;
"@)[0].results[0]

if ($after.active_users -ne 2 -or $after.correct_memberships -ne 2 -or
    $after.staff_assignments -ne 2 -or $after.cross_tenant_memberships -ne 0 -or
    $after.hamarr_memberships -ne $before.hamarr_memberships -or
    $after.hamarr_branch_staff -ne $before.hamarr_branch_staff -or
    $after.platform_admins -ne $before.platform_admins) {
  throw 'Post-provisioning verification failed. Stop and inspect the backup before retrying.'
}
Write-Host 'Provisioned and verified 2 active Manzur leaders. HAMARR baseline unchanged.'
Write-Host 'Require both leaders to change their temporary password in the app after first login.'
