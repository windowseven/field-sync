import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { sendContactInquiryEmail } from '../services/emailService.js';

export const submitContactInquiry = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ status: 'error', message: 'All fields are required' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ status: 'error', message: 'Invalid email format' });
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
  } catch (error) {
    logger.error('Submit contact inquiry error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getContactInquiries = async (req, res) => {
  try {
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
  } catch (error) {
    logger.error('Get contact inquiries error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_response } = req.body;

    if (!status) {
      return res.status(400).json({ status: 'error', message: 'Status is required' });
    }

    await pool.query(
      'UPDATE contact_inquiries SET status = ?, admin_response = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, admin_response || null, id]
    );

    res.json({ status: 'success', message: 'Inquiry status updated' });
  } catch (error) {
    logger.error('Update inquiry status error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
