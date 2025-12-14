import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { Text } from '../components';
import './Supervisor.css';

export const Supervisor: React.FC = () => {
  const { fleets, users, fetchFleets, fetchUsers, loading } = useAppStore();

  useEffect(() => {
    fetchFleets();
    fetchUsers();
  }, [fetchFleets, fetchUsers]);

  return (
    <div className="supervisor-page">
      <header className="supervisor-header">
        <Text variant="heading">Supervisor Dashboard</Text>
      </header>

      <div className="supervisor-content">
        <div className="supervisor-section">
          <Text variant="subheading">Fleets</Text>
          {loading.fleets ? (
            <Text variant="body">Loading...</Text>
          ) : fleets.length === 0 ? (
            <Text variant="body">No fleets found.</Text>
          ) : (
            <div className="fleets-list">
              {fleets.map((fleet) => (
                <div key={fleet.id} className="fleet-card">
                  <Text variant="body" bold>
                    {fleet.company_name}
                  </Text>
                  <Text variant="caption">Locations: {fleet.locations}</Text>
                  <Text variant="caption">Operation Type: {fleet.operation_type}</Text>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="supervisor-section">
          <Text variant="subheading">Users</Text>
          {loading.users ? (
            <Text variant="body">Loading...</Text>
          ) : users.length === 0 ? (
            <Text variant="body">No users found.</Text>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <div key={user.id} className="user-card">
                  <Text variant="body" bold>
                    {user.name || user.email}
                  </Text>
                  <Text variant="caption">{user.email}</Text>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

