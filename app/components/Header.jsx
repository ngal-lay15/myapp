import Link from 'next/link';
import logo from '../../img/logo.png';
import cartimg from '../../img/cart.png';
import { useCart } from '../../CartContext';


const Header = ({params}) =>{
  
  const { cart } = useCart();

  return(
  <header>
    <nav>
      <ul>
        <li>
          <Link href={`/${params}/menu`}> 
                <img
                src={logo.src}
                width="50px"
                height="50px"
                />
         </Link>
        </li>
        <li>
          <Link className="button-link"href={`/${params}/menu`}>Menu</Link>
        </li>
        <li>
        <Link className="button-link" href={`/${params}/contact`}>Contact</Link>
        </li>
        <li>
        <Link href={`/${params}/cart`}
>
  {cart.length}
              <img
                src={cartimg.src}
                width="50px"
                height="50px"
              />
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
        justify-content: space-around;
      }
      nav ul li {
        margin-right: 1rem;
      }
      nav ul li a {
        color: #fff;
        text-decoration: none;
      }
    `}</style>
  </header>
);
}
export default Header;
