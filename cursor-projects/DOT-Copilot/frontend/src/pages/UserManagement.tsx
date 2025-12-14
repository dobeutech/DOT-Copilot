import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Button, Text } from '../components';
import './UserManagement.css';

export const UserManagement: React.FC = () => {
  const { users, fetchUsers, loading } = useAppStore();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="user-management-page">
      <header className="user-management-header">
        <Text variant="heading">User Management</Text>
        <Button variant="primary">Add User</Button>
      </header>

      <div className="user-management-content">
        {loading.users ? (
          <Text variant="body">Loading...</Text>
        ) : users.length === 0 ? (
          <Text variant="body">No users found.</Text>
        ) : (
          <div className="users-table">
            <div className="table-header">
              <Text variant="body" bold>Name</Text>
              <Text variant="body" bold>Email</Text>
              <Text variant="body" bold>Actions</Text>
            </div>
            {users.map((user) => (
              <div key={user.id} className="table-row">
                <Text variant="body">{user.name || 'N/A'}</Text>
                <Text variant="body">{user.email}</Text>
                <div className="row-actions">
                  <Button variant="outline" size="small">Edit</Button>
                  <Button variant="danger" size="small">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

