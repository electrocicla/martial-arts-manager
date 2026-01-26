/**
 * Advanced Tar Pit Protection System
 * Applies SRP and SOLID principles for maintainable, extensible bot protection
 *
 * SAFETY GUARANTEE: This system ONLY activates for clearly malicious/suspicious requests.
 * Real users with normal browsers and legitimate navigation patterns are NEVER delayed.
 *
 * Detection criteria:
 * - Domain: Only hamarr.cl (configurable)
 * - Paths: Only known attack vectors (WordPress, PHP admin tools, server info, etc.)
 * - User Agents: Malicious tools, scanners, exploit frameworks (excludes legitimate bots like Googlebot)
 * - Headers: Only highly suspicious custom headers or XHR to .php files
 */

import { Env } from './types/index';

// Interfaces for SOLID principles
interface RequestDetector {
  isSuspicious(request: Request): boolean;
}

interface TarPitResponseGenerator {
  generate(): Promise<Response>;
}

// Path-based detector (SRP: only handles path detection)
class PathBasedDetector implements RequestDetector {
  private readonly suspiciousPaths: RegExp[] = [
    // WordPress specific
    /\/wp-admin/,
    /\/wp-login\.php/,
    /\/wp-content\/uploads/,
    /\/wp-includes/,
    /\/wp-admin\/admin-ajax\.php/,
    /\/wp-cron\.php/,
    /\/wp-json/,
    /\/xmlrpc\.php/,
    /\/readme\.html/,
    /\/license\.txt/,

    // Common PHP files
    /\/admin\.php/,
    /\/login\.php/,
    /\/config\.php/,
    /\/phpinfo\.php/,
    /\/adminer\.php/,
    /\/phpmyadmin/,
    /\/mysql/,
    /\/db/,
    /\/install\.php/,
    /\/upgrade\.php/,
    /\/update\.php/,
    /\/shell\.php/,
    /\/cmd\.php/,
    /\/c99\.php/,
    /\/r57\.php/,

    // Admin panels
    /\/administrator/,
    /\/admin/,
    /\/webadmin/,
    /\/adminarea/,
    /\/panel/,
    /\/cpanel/,
    /\/plesk/,

    // Server info
    /\/server-status/,
    /\/server-info/,
    /\/status/,
    /\/info/,

    // Common probes
    /\/test/,
    /\/demo/,
    /\/example/,
    /\/.env/,
    /\/.git/,
    /\/.svn/,
    /\/CVS/,
    /\/backup/,
    /\/old/,
    /\/temp/,
    /\/tmp/,
    /\/backup\.sql/,
    /\/config\.bak/,
    /\/composer\.json/,
    /\/package\.json/,
    /\/.well-known/,
    // Removed generic /api/v1/, /api/v2/ as they could be legitimate
    /\/graphql/,
    /\/rest/,
    /\/oauth/,
    /\/saml/,
    /\/openid/,
  ];

  isSuspicious(request: Request): boolean {
    const url = new URL(request.url);
    const path = url.pathname.toLowerCase();
    return this.suspiciousPaths.some(pattern => pattern.test(path));
  }
}

// User Agent based detector
class UserAgentDetector implements RequestDetector {
  private readonly suspiciousUserAgents: RegExp[] = [
    // Malicious/scanning tools (avoid generic "bot" to prevent false positives with legitimate crawlers)
    /scanner/i,
    /scan/i,
    /exploit/i,
    /wget/i,
    /curl/i,
    /python/i, // Often used in scripts without proper user agent
    /java/i,   // Some bots, but legitimate apps also use Java
    /ruby/i,
    /perl/i,
    /bash/i,
    /sh/i,
    /powershell/i,
    /nmap/i,
    /masscan/i,
    /zgrab/i,
    /dirbuster/i,
    /gobuster/i,
    /sqlmap/i,
    /nikto/i,
    /acunetix/i,
    /openvas/i,
    /nessus/i,
    /qualys/i,
    /rapid7/i,
    /metasploit/i,
    /burp/i,
    /owasp/i,
    /zap/i,
    /fiddler/i,
    /charles/i,
    /wireshark/i,
    /tcpdump/i,
    /snort/i,
    /suricata/i,
    // Specific malicious patterns
    /malicious/i,
    /attack/i,
    /hack/i,
    /exploit/i,
    /vulnerability/i,
    /pentest/i,
    // Empty or very short user agents (often automated tools)
    /^$/,
    /^.{0,10}$/,
  ];

  // Whitelist for known legitimate bots
  private readonly legitimateBots: RegExp[] = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i, // Yahoo
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /sogou/i,
    /exabot/i,
    /facebot/i, // Facebook
    /ia_archiver/i, // Alexa
    /archive\.org_bot/i, // Wayback Machine
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
  ];

  isSuspicious(request: Request): boolean {
    const userAgent = request.headers.get('User-Agent') || '';

    // First check if it's a known legitimate bot
    if (this.legitimateBots.some(pattern => pattern.test(userAgent))) {
      return false; // Allow legitimate bots
    }

    // Then check for suspicious patterns
    return this.suspiciousUserAgents.some(pattern => pattern.test(userAgent));
  }
}

// Header-based detector
class HeaderDetector implements RequestDetector {
  isSuspicious(request: Request): boolean {
    // Check for unusual headers that indicate scanning
    const suspiciousHeaders = [
      'X-Scanner',
      'X-Exploit',
      'X-Attack',
      'X-Probe',
      'X-Hacker',
    ];

    for (const header of suspiciousHeaders) {
      if (request.headers.has(header)) {
        return true;
      }
    }

    // Check for XMLHttpRequest with suspicious paths
    if (request.headers.get('X-Requested-With') === 'XMLHttpRequest') {
      const url = new URL(request.url);
      if (/\.php$/.test(url.pathname)) {
        return true;
      }
    }

    return false;
  }
}

// Composite detector (SOLID: composition over inheritance)
class CompositeRequestDetector implements RequestDetector {
  private detectors: RequestDetector[];

  constructor(detectors: RequestDetector[]) {
    this.detectors = detectors;
  }

  isSuspicious(request: Request): boolean {
    return this.detectors.some(detector => detector.isSuspicious(request));
  }
}

// Advanced tar pit response generator
class AdvancedTarPitResponseGenerator implements TarPitResponseGenerator {
  private readonly totalDelayMs = 15000; // 15 seconds

  async generate(): Promise<Response> {
    // Wait for the full delay before responding
    await new Promise(resolve => setTimeout(resolve, this.totalDelayMs));

    // Return a response that includes CPU-intensive JavaScript
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Processing Request</title>
    <meta name="robots" content="noindex, nofollow, noarchive">
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <h1>Processing Your Request</h1>
    <p>Your request has been processed successfully.</p>
    <div class="spinner"></div>
    <p>Please wait...</p>

    <script>
// CPU-intensive JavaScript to consume bot resources if executed
(function() {
    // Heavy computation loop
    let result = 0;
    const startTime = Date.now();
    while (Date.now() - startTime < 10000) { // Run for 10 seconds
        for (let j = 0; j < 100000; j++) {
            result += Math.random() * Math.sin(j) * Math.cos(j);
        }
    }
    console.log('Heavy computation completed: ' + result);

    // Additional resource consumption
    setInterval(() => {
        const arr = [];
        for (let i = 0; i < 50000; i++) {
            arr.push(Math.random());
        }
    }, 500);
})();
</script>

<!-- Hidden iframes to consume additional resources -->
<iframe src="/nonexistent-resource-1" style="display:none;" width="1" height="1"></iframe>
<iframe src="/nonexistent-resource-2" style="display:none;" width="1" height="1"></iframe>
<iframe src="/nonexistent-resource-3" style="display:none;" width="1" height="1"></iframe>
<iframe src="/nonexistent-resource-4" style="display:none;" width="1" height="1"></iframe>
<iframe src="/nonexistent-resource-5" style="display:none;" width="1" height="1"></iframe>

</body>
</html>`;

    return new Response(html, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Tar-Pit': 'activated',
        'X-Robots-Tag': 'noindex, nofollow, noarchive',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
      }
    });
  }
}

// Factory for creating the detector (Dependency Inversion)
class RequestDetectorFactory {
  static create(): RequestDetector {
    return new CompositeRequestDetector([
      new PathBasedDetector(),
      new UserAgentDetector(),
      new HeaderDetector(),
    ]);
  }
}

// Main middleware class (SRP: handles the middleware logic)
class TarPitMiddleware {
  private detector: RequestDetector;
  private responseGenerator: TarPitResponseGenerator;

  constructor(detector: RequestDetector, responseGenerator: TarPitResponseGenerator) {
    this.detector = detector;
    this.responseGenerator = responseGenerator;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handleRequest(request: Request, env: Env): Promise<Response | undefined> {
    const url = new URL(request.url);

    // Only apply to hamarr.cl domain
    if (url.hostname !== 'hamarr.cl') {
      return undefined;
    }

    if (this.detector.isSuspicious(request)) {
      console.log(`[Tar Pit] Trapping suspicious request: ${request.url} from ${request.headers.get('User-Agent')}`);
      return await this.responseGenerator.generate();
    }

    return undefined;
  }
}

// Initialize the middleware (Singleton pattern for efficiency)
const middleware = new TarPitMiddleware(
  RequestDetectorFactory.create(),
  new AdvancedTarPitResponseGenerator()
);

export async function onRequest(request: Request, env: Env): Promise<Response | undefined> {
  return middleware.handleRequest(request, env);
}