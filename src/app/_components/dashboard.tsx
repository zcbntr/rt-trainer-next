import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="text-3xl">Dashboard</h1>
      <div className="flex max-w-md flex-col gap-1 pt-10">
        <Link href="/plan">Plan</Link>
        <Link href="/my-scenarios">My Scenarios</Link>
      </div>
    </div>
  );
}
