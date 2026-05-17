export function getUserRole(userId) {
  if (userId.startsWith('admin-')) return 'admin';
  if (userId.startsWith('sup-')) return 'supervisor';
  if (userId.startsWith('tl-')) return 'team_leader';
  return 'field_agent';
}

export function getNotificationLink(userId) {
  const role = getUserRole(userId);
  if (role === 'admin') return '/admin/notifications';
  if (role === 'supervisor') return '/supervisor/notifications';
  if (role === 'team_leader') return '/teamleader/notifications';
  return '/user/notifications';
}
