import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { sendContactInquiryEmail } from '../services/emailService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const submitContactInquiry = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      throw new AppError('All fields are required', 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError('Invalid email format', 400);
    }

    const id = uuidv4();
    await pool.query(
      'INSERT INTO contact_inquiries (id, name, email, subject, message, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, email, subject, message, 'new']
    );

    logger.info(`Contact inquiry received from ${name} (${email}): ${subject}`);

    // Send notification email to support team
    try {
      await sendContactInquiryEmail({ name, email, subject, message });
    } catch (emailError) {
      logger.warn('Contact inquiry email notification failed, but inquiry was saved:', emailError);
    }

    res.status(201).json({
      status: 'success',
      message: 'Your message has been sent successfully. We will respond within 24 hours.',
    });
});
export const getContactInquiries = asyncHandler(async (req, res) => {
    const { status, subject } = req.query;
    let query = 'SELECT * FROM contact_inquiries WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (subject) {
      query += ' AND subject = ?';
      params.push(subject);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const [rows] = await pool.query(query, params);
    res.json({ status: 'success', data: { inquiries: rows } });
});

export const updateInquiryStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, admin_response } = req.body;

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    await pool.query(
      'UPDATE contact_inquiries SET status = ?, admin_response = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, admin_response || null, id]
    );

    res.json({ status: 'success', message: 'Inquiry status updated' });
});
