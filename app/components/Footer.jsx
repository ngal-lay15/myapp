import '../../globals.css'
const Footer = () => (
    <footer>
      <p>&copy; {new Date().getFullYear()} Your Restaurant Name. All rights reserved.</p>
      <style jsx>{`
        footer {
          background: black;
          color: orange;
          text-align: center;
          padding: 1rem;
          position: absolute;
          bottom: 0;
          width: 100%;
        }
      `}</style>
    </footer>
  );
  
  export default Footer;
  