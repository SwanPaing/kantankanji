import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen py-16">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/80 p-10 text-center shadow-2xl ring-1 ring-white/10">
        <p className="text-sm uppercase tracking-[0.3em] text-green-300">Page not found</p>
        <h1 className="mt-6 text-5xl font-bold text-white">404</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-green-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-green-300"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
