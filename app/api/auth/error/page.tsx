export default function AuthError({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold">Authentication Error</h1>
      <p className="mt-4 text-xl">
        {searchParams.error || "An error occurred during authentication"}
      </p>
    </div>
  );
}