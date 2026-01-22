/**
 * QR Code Management API for Instructors/Admins
 * 
 * GET /api/attendance/qr - List QR codes for instructor
 * POST /api/attendance/qr - Create new QR code
 * DELETE /api/attendance/qr?id=xxx - Delete QR code
 */

import { Env } from '../../types/index';
import { authenticateUser } from '../../middleware/auth';

interface QRCodeRecord {
  id: string;
  instructor_id: string;
  class_id: string | null;
  location: string;
  code: string;
  is_active: number;
  valid_from: string | null;
  valid_until: string | null;
  check_in_radius_meters: number | null;
  created_at: string;
  updated_at: string;
}

interface CreateQRRequest {
  location: string;
  class_id?: string;
  valid_from?: string;
  valid_until?: string;
  check_in_radius_meters?: number;
}

// GET - List instructor's QR codes
export async function onRequestGet({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only instructors and admins can manage QR codes
    if (auth.user.role === 'student') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get QR codes for this instructor (admins see all)
    let query = `
      SELECT qr.*, u.name as instructor_name
      FROM attendance_qr_codes qr
      LEFT JOIN users u ON qr.instructor_id = u.id
    `;
    const params: string[] = [];

    if (auth.user.role !== 'admin') {
      query += ' WHERE qr.instructor_id = ?';
      params.push(auth.user.id);
    }

    query += ' ORDER BY qr.created_at DESC';

    const { results } = await env.DB.prepare(query)
      .bind(...params)
      .all<QRCodeRecord & { instructor_name: string }>();

    return new Response(JSON.stringify({ 
      qr_codes: results || [] 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('QR list error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST - Create new QR code
export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (auth.user.role === 'student') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json() as CreateQRRequest;
    const { location, class_id, valid_from, valid_until, check_in_radius_meters } = body;

    if (!location) {
      return new Response(JSON.stringify({ error: 'Location is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique QR code value
    const qrId = crypto.randomUUID();
    const qrCode = `HAMARR-${crypto.randomUUID().toUpperCase().slice(0, 8)}`;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO attendance_qr_codes (
        id, instructor_id, class_id, location, code, is_active,
        valid_from, valid_until, check_in_radius_meters,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `).bind(
      qrId,
      auth.user.id,
      class_id || null,
      location,
      qrCode,
      valid_from || null,
      valid_until || null,
      check_in_radius_meters || null,
      now,
      now
    ).run();

    // Fetch the created record
    const newQR = await env.DB.prepare(`
      SELECT * FROM attendance_qr_codes WHERE id = ?
    `).bind(qrId).first<QRCodeRecord>();

    return new Response(JSON.stringify({ 
      success: true,
      qr_code: newQR
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('QR create error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE - Deactivate/delete QR code
export async function onRequestDelete({ request, env }: { request: Request; env: Env }) {
  try {
    const auth = await authenticateUser(request, env);
    if (!auth.authenticated) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (auth.user.role === 'student') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const qrId = url.searchParams.get('id');

    if (!qrId) {
      return new Response(JSON.stringify({ error: 'QR code ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify ownership (unless admin)
    const qrRecord = await env.DB.prepare(`
      SELECT id, instructor_id FROM attendance_qr_codes WHERE id = ?
    `).bind(qrId).first<{ id: string; instructor_id: string }>();

    if (!qrRecord) {
      return new Response(JSON.stringify({ error: 'QR code not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (auth.user.role !== 'admin' && qrRecord.instructor_id !== auth.user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Soft delete by deactivating
    await env.DB.prepare(`
      UPDATE attendance_qr_codes SET is_active = 0, updated_at = ? WHERE id = ?
    `).bind(new Date().toISOString(), qrId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('QR delete error:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
