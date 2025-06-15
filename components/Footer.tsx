import { siteMetadata } from '@/lib/siteMetadata';
import { FaXTwitter, FaLinkedin, FaGithub } from 'react-icons/fa6';

export default function Footer() {
  return (
    <footer className="mt-8 flex flex-col items-center gap-4 py-8 border-t">
      <div className="flex gap-4 text-2xl">
        <a
          href={siteMetadata.twitter}
          aria-label="Twitter"
          className="hover:text-blue-500"
        >
          <FaXTwitter />
        </a>
        <a
          href={siteMetadata.linkedin}
          aria-label="LinkedIn"
          className="hover:text-blue-600"
        >
          <FaLinkedin />
        </a>
        <a
          href={siteMetadata.github}
          aria-label="GitHub"
          className="hover:text-gray-600"
        >
          <FaGithub />
        </a>
      </div>
      <a href="#ask-form" className="underline">
        Ask Us
      </a>
    </footer>
  );
}
