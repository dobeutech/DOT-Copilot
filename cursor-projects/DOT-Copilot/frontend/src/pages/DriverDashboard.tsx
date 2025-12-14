import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { Button, Text } from '../components';
import './DriverDashboard.css';

export const DriverDashboard: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { assignments, notifications, fetchAssignments, fetchNotifications, loading } = useAppStore();

  useEffect(() => {
    if (user?.id) {
      fetchAssignments(user.id);
      fetchNotifications(user.id);
    }
  }, [user, fetchAssignments, fetchNotifications]);

  const unreadNotifications = notifications.filter(n => !n.is_read).length;
  const pendingAssignments = assignments.filter(a => a.status !== 'completed').length;

  return (
    <div className="driver-dashboard">
      <header className="dashboard-header">
        <Text variant="heading">Driver Dashboard</Text>
        <div className="header-actions">
          <Text variant="body">Welcome, {user?.name || user?.email}</Text>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-stats">
          <div className="stat-card">
            <Text variant="subheading">{pendingAssignments}</Text>
            <Text variant="caption">Pending Assignments</Text>
          </div>
          <div className="stat-card">
            <Text variant="subheading">{unreadNotifications}</Text>
            <Text variant="caption">Unread Notifications</Text>
          </div>
        </div>

        <div className="dashboard-section">
          <Text variant="subheading">My Assignments</Text>
          {loading.assignments ? (
            <Text variant="body">Loading...</Text>
          ) : assignments.length === 0 ? (
            <Text variant="body">No assignments found.</Text>
          ) : (
            <div className="assignments-list">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="assignment-card">
                  <Text variant="body" bold>
                    {assignment.training_program?.program_name || 'Training Program'}
                  </Text>
                  <Text variant="caption">Status: {assignment.status}</Text>
                  {assignment.due_date && (
                    <Text variant="caption">
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </Text>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-section">
          <Text variant="subheading">Notifications</Text>
          {loading.notifications ? (
            <Text variant="body">Loading...</Text>
          ) : notifications.length === 0 ? (
            <Text variant="body">No notifications.</Text>
          ) : (
            <div className="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                >
                  <Text variant="body">{notification.message}</Text>
                  <Text variant="caption">
                    {notification.notification_type}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

