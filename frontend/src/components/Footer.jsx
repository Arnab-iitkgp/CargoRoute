import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

const Footer = function () {
  return (
    <div className="mt-6 text-center text-xs text-gray-500">
      <p>© {new Date().getFullYear()} Arnab Chakraborty</p>
      <div className="flex justify-center space-x-4 mt-2 text-gray-600">
        <a
          href="https://github.com/Arnab-iitkgp"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600"
        >
          <FaGithub size={18} />
        </a>
        <a
          href="https://linkedin.com/in/arnab-dev"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600"
        >
          <FaLinkedin size={18} />
        </a>
        <a
          href="mailto:arnabchakraborty7574@gmail.com"
          className="hover:text-blue-600"
        >
          <FaEnvelope size={18} />
        </a>
      </div>
    </div>
  );
};
export default Footer;
