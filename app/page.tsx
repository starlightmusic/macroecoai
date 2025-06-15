import Image from 'next/image';
import Footer from '@/components/Footer';

const articles = [
  {
    title: 'How AI Reads the Economy',
    excerpt:
      'Exploring how artificial intelligence interprets complex macroeconomic trends in seconds.',
    img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'Global Markets in 2024',
    excerpt:
      'A sneak peek into what analysts expect for the coming year across major economies.',
    img: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=800&q=80',
  },
  {
    title: 'The Future of Monetary Policy',
    excerpt:
      'Why central banks are turning to machine learning models to guide decisions.',
    img: 'https://images.unsplash.com/photo-1526378722397-9ae73c4a9e09?auto=format&fit=crop&w=800&q=80',
  },
];

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <section className="flex flex-col items-center justify-center flex-1 text-center py-20 px-4">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
          Understand Macroeconomics the Modern Way
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
          AI-powered insights in your inbox
        </p>
        <a
          href="/subscribe"
          className="mt-6 inline-block rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Get the Beta (Free)
        </a>
      </section>

      <section className="grid gap-6 md:grid-cols-3 px-4 max-w-5xl mx-auto">
        {articles.map((a) => (
          <article
            key={a.title}
            className="border rounded shadow-sm overflow-hidden"
          >
            <Image
              src={a.img}
              alt={a.title}
              width={400}
              height={200}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="font-semibold text-lg">{a.title}</h2>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {a.excerpt}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section id="ask-form" className="mt-12 px-4">
        <h2 className="text-2xl font-semibold text-center mb-4">Ask Us</h2>
        <form
          method="POST"
          action={process.env.FORMSPREE_ENDPOINT}
          className="max-w-md mx-auto flex flex-col gap-4"
        >
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
          <textarea
            required
            name="question"
            placeholder="Your question"
            rows={4}
            className="border p-2 rounded"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 text-white py-2 hover:bg-blue-700"
          >
            Send
          </button>
        </form>
      </section>

      <Footer />
    </main>
  );
}
