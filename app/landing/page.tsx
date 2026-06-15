import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const user = await currentUser();

  // If user is authenticated, redirect to main page
  if (user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Task List App</h1>
          <p className="text-gray-600">Organize your tasks and boost your productivity</p>
        </div>

        <div className="flex flex-col gap-4">
          <SignInButton mode="modal">
            <button className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Sign In
            </button>
          </SignInButton>

          <SignUpButton mode="modal">
            <button className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              Sign Up
            </button>
          </SignUpButton>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Sign in or create an account to get started</p>
        </div>
      </div>
    </div>
  );
}