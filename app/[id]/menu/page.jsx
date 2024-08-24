"use client";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import logo from '../../../img/logo.png';
import '../../../globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCart } from '../../../CartContext';

const Home = ({params}) =>{

  const {dispatch } = useCart();

  const menuItems = [
    { id: 1, name: 'Pizza', price: 10 },
    { id: 2, name: 'Burger', price: 5 },
    { id: 3, name: 'Pasta', price: 7 },
  ];

  const addToCart = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

 return (
  <div>
    <Header params={params.id}/>
    <main>
    <div>
      <h2>Menu</h2>
      <ul>
        {menuItems.map((item) => (
          <li key={item.id}>
            {item.name} - ${item.price}
            <button onClick={() => addToCart( item)}>Add to Cart</button>
            </li>
        ))}
      </ul>
    </div> 
    </main>
    <Footer />
  </div>
);

}

export default Home;
