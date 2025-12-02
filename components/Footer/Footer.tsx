import Link from "next/link";
import { FaArrowTurnDown } from "react-icons/fa6";

const SOCIALS = [
  {
    title: "Twitter",
    icon: "/images/socials/twitter.png",
    link: "",
  },
  {
    title: "Instagram",
    icon: "/images/socials/instagram.png",
    link: "",
  },
  {
    title: "GitHub",
    icon: "/images/socials/github.png",
    link: "",
  },
];

const FOOTER_ITEMS = [
  {
    title: "Home",
    link: "",
  },
  {
    title: "About",
    link: "",
  },
  {
    title: "Contact",
    link: "",
  },
  {
    title: "Terms of Service",
    link: "",
  },
];

const Footer = () => {
  return (
    <section className="w-dvw h-[90dvh] p-2 relative overflow-x-hidden">
      <img
        src="/images/footer/bg.png"
        alt=""
        className="w-full h-full object-fill rounded-4xl"
      />
      <div className="absolute text-white inset-0 p-2 w-full h-full">
        <div className="h-[75%] w-full pt-30">
          <div className="flex flex-col items-center justify-center gap-10">
            <h2 className="font-medium text-6xl text-center max-w-4xl">
              Invest in creators before everyone else gets it.
            </h2>
            <button
              type="button"
              className="text-xl border border-zinc-900 bg-linear-to-t from-[#FF2F00] to-[#f5775b] cursor-pointer hover:from-[#FF2F00] hover:to-[#FF2F00] font-semibold text-white px-7 py-3 rounded-full transition-all duration-300 relative z-50"
            >
              Invest Like It's 2026
            </button>
            <div className="flex flex-col gap-3 items-center">
              <div className="flex">
                {SOCIALS.map((social, index) => {
                  const randomRotation = Math.random() * 20 - 10;

                  return (
                    <Link key={index} href={social.link}>
                      <div
                        className="p-3 border border-zinc-300 bg-white shadow-zinc-500 rounded-xl hover:-translate-y-2 duration-300 transition-all"
                        style={{
                          transform: `rotate(${randomRotation}deg)`,
                        }}
                      >
                        <img
                          src={social.icon}
                          alt={social.title}
                          className="h-5 w-5"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>

              <p className="text-zinc-400 font-medium">
                Follow us on these platforms
              </p>
            </div>
          </div>
        </div>
        <div className="h-[25%] w-full backdrop-blur-2xl border-dashed border-t border-zinc-700 flex rounded-b-4xl">
          <div className="h-full w-[70%] border-r border-dashed border-zinc-700 flex flex-col justify-between p-10">
            {FOOTER_ITEMS.map((item, index) => (
              <Link
                href={item.link}
                className="text-white text-lg font-medium"
                key={index}
              >
                {item.title}
              </Link>
            ))}
          </div>
          <div className="h-full w-[30%] p-12 flex flex-col gap-5">
            <div className="pl-2">Stay in touch</div>
            <div className="w-full h-[50px] bg-[#121111cb] rounded-xl border border-zinc-700 flex justify-between p-[2px]">
              <input
                type="text"
                placeholder="name@gmail.com"
                className="w-full px-5 focus:outline-none"
              />
              <button className="w-fit px-7 py-2 bg-[#292929] rounded-xl flex gap-5 items-center">
                <FaArrowTurnDown className="h-5 rotate-90" />
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Footer;
