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
            <a style={{ fontFamily: 'Lora' }} href={`/${params}/menu`}>Menu</a>
          </li>
          <li className="left-section">
            <a style={{ fontFamily: 'Lora' }} href={`/${params}/contact`}>Contact</a>
          </li>
          <li className="right-section">
            <Link href={`/${params}/cart`}>
              <div className="cart-icon">
                <span className="cart-count">{cart.length}</span>
                <img src={cartimg.src} width="50px" height="50px" alt="Cart" />
              </div>
            </Link>
          </li>
        </ul>
      </nav>
      <style jsx>{`
        header {
          position: fixed;
          top: 0;
          width: 100%;
          background: #333;
          color: #fff;
          padding: 1rem;
          z-index: 1000;
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
        .cart-icon {
          position: relative;
          display: inline-block;
        }
        .cart-count {
          position: absolute;
          top: -10px;
          right: -10px;
          background-color: red;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: bold;
        }
        @media (max-width: 768px) {
          .button-link {
            width: 40px;
            height: 30px;
          }
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
            line-height: 30px; /* Adjusted line height */
          }
          img {
            width: 40px;
            height: 40px;
          }
          .cart-count {
            width: 16px;
            height: 16px;
            font-size: 0.65rem;
            top: -8px;
            right: -8px;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
