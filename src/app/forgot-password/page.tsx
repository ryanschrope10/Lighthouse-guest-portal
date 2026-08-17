import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Guest<span className="text-gold-600"> Portal</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">Reset your password</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-sand-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-50">
              <svg
                className="h-6 w-6 text-gold-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Need to reset your password?
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              For your security, password resets are handled by our team.
              Contact the front desk and a staff member will send you a
              single-use link to choose a new password.
            </p>
            <p className="mt-4 text-sm text-gray-600">
              You can reach us by phone or email, or stop by the office during
              business hours. Reset links expire after an hour.
            </p>
          </div>
        </div>

        {/* Back to Login */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link
            href="/login"
            className="font-medium text-gold-600 hover:text-gold-700"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
