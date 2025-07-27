import { UserCircleIcon, KeyIcon, BellIcon } from '@heroicons/react/24/outline';

export default function AdminSettingsPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <div className="card">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <UserCircleIcon className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Profile Settings</h3>
          </div>
          <p className="mb-4 text-gray-600">Update your profile information here. (Coming soon)</p>
        </div>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <KeyIcon className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Change Password</h3>
          </div>
          <p className="mb-4 text-gray-600">Change your account password. (Coming soon)</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BellIcon className="h-5 w-5 text-yellow-500" />
            <h3 className="text-lg font-semibold">Notification Preferences</h3>
          </div>
          <p className="mb-4 text-gray-600">Manage your notification settings. (Coming soon)</p>
        </div>
      </div>
    </div>
  );
} 