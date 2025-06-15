'use client';
import { useState } from 'react';
import { trackSubscribe } from '@/lib/track';

export default function Subscribe() {
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await fetch('https://formspree.io/f/xkgbbvda', {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });
    if (res.ok) {
      setStatus('success');
      trackSubscribe();
      form.reset();
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-bold text-center mb-6">Subscribe</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Why subscribe?</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Weekly deep dives</li>
          <li>AI-generated explainers</li>
          <li>Exclusive data tools</li>
        </ul>
      </section>

      <div className="border rounded p-4 mb-8 text-center">
        <p className="text-xl font-bold">$0 / month (Beta)</p>
      </div>

      {status === 'success' ? (
        <div className="p-4 bg-green-100 text-green-800 rounded">
          🎉 Thanks! Check your inbox for a welcome email.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            required
            type="text"
            name="name"
            placeholder="Name"
            className="border p-2 rounded"
          />
          <input
            required
            type="email"
            name="email"
            placeholder="Email"
            className="border p-2 rounded"
          />
          <input
            type="hidden"
            name="purchaseDate"
            value={new Date().toISOString()}
          />
          <button
            type="submit"
            className="rounded bg-blue-600 text-white py-2 hover:bg-blue-700"
          >
            Submit
          </button>
        </form>
      )}
    </main>
  );
}
