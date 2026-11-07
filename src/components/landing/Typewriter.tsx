'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/** Cycles through words with a typewriter effect. */
export function Typewriter({ words, className }: { words: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index % words.length];
    const done = !deleting && text === word;
    const cleared = deleting && text === '';
    const delay = done ? 1600 : cleared ? 300 : deleting ? 45 : 90;

    const t = window.setTimeout(() => {
      if (done) setDeleting(true);
      else if (cleared) {
        setDeleting(false);
        setIndex((i) => i + 1);
      } else {
        setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1));
      }
    }, delay);
    return () => window.clearTimeout(t);
  }, [text, deleting, index, words]);

  return (
    <span className={className}>
      {text}
      <motion.span
        className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.1em] rounded bg-primary"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
      />
    </span>
  );
}

export default Typewriter;
