// Email helper - All emails now use async queue processing
// Legacy sendMail removed - use queueEmail for better performance

export { queueEmail } from './queue.helper';
