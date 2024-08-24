"use client";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useCart } from '../../../CartContext';

const Home = ({params}) => {
  const { cart } = useCart();

  return(
  <div>
    <Header params={params.id}/>
    <main>
      <h1>Your Menu</h1>
      {cart.map(item => (
        <div key={item.id}>
          <p>{item.name}</p>
          <p>${item.price}</p>
        </div>
      ))}
    </main>
    <Footer />
  </div>
);
}

export default Home;
