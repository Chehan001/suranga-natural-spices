/** Formatting helpers. Money is handled as whole rupees. */
export const rs = (n) => 'Rs. ' + Math.round(n).toLocaleString('en-LK');
export const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const dayOffset = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
export const today = () => dayOffset(0);
