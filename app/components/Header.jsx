import Link from 'next/link';
import logo from '../../img/logo.png';
import cartimg from '../../img/cart.png';
import { useCart } from '../../CartContext';

const Header = ({ params }) => {
  const { cart } = useCart();

  return (
    <header>
      <nav>
        <ul>
          <li className="left-section">
            <Link href={`/${params}/menu`}>
              <img src={logo.src} width="50px" height="50px" alt="Logo" />
            </Link>
          </li>
          <li className="left-section">
            <Link className="button-link" href={`/${params}/menu`}>Menu</Link>
          </li>
          <li className="left-section">
            <Link className="button-link" href={`/${params}/contact`}>Contact</Link>
          </li>
          <li className="right-section">
            <Link href={`/${params}/cart`}>
              {cart.length}
              <img src={cartimg.src} width="50px" height="50px" alt="Cart" />
            </Link>
          </li>
        </ul>
      </nav>
      <style jsx>{`
        header {
          background: #333;
          color: #fff;
          padding: 1rem;
        }
        nav ul {
          display: flex;
          list-style: none;
          justify-content: space-between;
          align-items: center;
          padding: 0;
          margin: 0;
          flex-wrap: wrap;
        }
        nav ul li {
          margin-right: 1rem;
        }
        nav ul li a {
          color: #fff;
          text-decoration: none;
        }
        .left-section {
          display: flex;
          align-items: center;
        }
        .right-section {
          margin-left: auto;
          display: flex;
          align-items: center;
        }
        @media (max-width: 768px) {
          header {
            padding: 0.5rem;
          }
          nav ul {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            width: 100%;
          }
          nav ul li {
            margin-right: 0;
            margin-bottom: 0.5rem;
            flex: 1;
            text-align: center;
          }
          .right-section {
            margin-left: 0;
            align-self: center;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          nav ul li a {
            font-size: 1.2rem; /* Increased font size for better readability */
            padding: 10px 20px; /* Added padding to increase button size */
            line-height: 40px; /* Ensures consistent height alignment */
          }
          img {
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
    </header>
  );
}

export default Header;
