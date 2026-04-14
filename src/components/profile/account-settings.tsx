"use client";

import { useState } from "react";
import {
  KeyRound,
  LogOut,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountSettings() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleChangePassword() {
    console.log("Navigate to change password flow");
    // Placeholder: would trigger a Supabase password reset email or modal
    alert("A password reset link will be sent to your email.");
  }

  function handleSignOut() {
    console.log("Signing out...");
    // Placeholder: would call supabase.auth.signOut() and redirect
    alert("You have been signed out.");
  }

  function handleDeleteAccount() {
    console.log("Account deletion requested");
    // Placeholder: would call API to delete account
    alert(
      "Account deletion has been requested. You will receive a confirmation email.",
    );
    setShowDeleteConfirm(false);
  }

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="flex items-center justify-between rounded-lg border border-sand-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-sand-500" />
          <div>
            <p className="text-sm font-medium text-sand-900">
              Change Password
            </p>
            <p className="text-xs text-sand-500">
              Update your account password
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleChangePassword}>
          Change
        </Button>
      </div>

      {/* Sign Out */}
      <div className="flex items-center justify-between rounded-lg border border-sand-200 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <LogOut className="h-5 w-5 text-sand-500" />
          <div>
            <p className="text-sm font-medium text-sand-900">Sign Out</p>
            <p className="text-xs text-sand-500">
              Sign out of your account on this device
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      {/* Danger zone */}
      <div className="rounded-lg border border-red-200 bg-red-50/50">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-semibold">Danger Zone</span>
          </div>
          <p className="mt-1 text-xs text-red-600">
            Deleting your account is permanent and cannot be undone. All your
            data, bookings, and documents will be removed.
          </p>
        </div>

        {!showDeleteConfirm ? (
          <div className="border-t border-red-200 px-4 py-3">
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        ) : (
          <div className="border-t border-red-200 px-4 py-3 space-y-3">
            <p className="text-sm font-medium text-red-700">
              Are you sure you want to delete your account?
            </p>
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
                Yes, Delete My Account
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
