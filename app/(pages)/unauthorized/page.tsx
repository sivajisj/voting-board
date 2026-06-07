import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">403</h1>
        <p className="text-gray-500 mb-2">Forbidden</p>
        <p className="text-sm text-gray-400 mb-6">
          You do not have permission to access this page
        </p>
        <Link
          href="/login"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          Go to Login
        </Link>
      </div>
    </div>
  );
}