import { motion } from "motion/react";
import Link from "next/link";
import NextImage from "next/image";

const Logo = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    className="flex gap-2 items-center"
  >
    <Link href="/">
      <NextImage
        src="/images/logo/logo-icon.jpeg"
        alt="Draviya Logo Icon"
        width={32}
        height={32}
        className="h-8 w-auto rounded-md"
        priority
      />
    </Link>
    <Link href="/">
      <NextImage
        src="/images/logo/logo-name-light.png"
        alt="Draviya Logo Text"
        width={100}
        height={24}
        className="h-6 w-auto"
        priority
      />
    </Link>
  </motion.div>
);

export default Logo;
