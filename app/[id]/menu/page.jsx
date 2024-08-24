"use client";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import logo from '../../../img/logo.png';
import '../../../globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCart } from '../../../CartContext';
import { useEffect, useState } from "react";

import { db } from "../../firebaseConfig";
import { collection,onSnapshot } from "firebase/firestore";

function useFirestoreCollection(collectionName) {
  const [data, setData] = useState([]);

  useEffect(() => {
    const collectionRef = collection(db, collectionName);

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const fetchedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(fetchedData);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [collectionName]);

  return data;
}

const Home = ({params}) =>{

  const styles = {
    container: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
    },
    card: {
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      width: '200px',
      textAlign: 'center',
    },
    image: {
      width: '100%',
      height: 'auto',
      borderRadius: '8px 8px 0 0',
    },
    button: {
      marginTop: '8px',
      padding: '8px 16px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    },
  };

  const {dispatch } = useCart();

  const addToCart = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };


  const itemData = useFirestoreCollection("messages");

 return (
  <div>
    <Header params={params.id}/>
    <main>
    <div>
      <ul>
      <div style={styles.container}>
      {itemData.map((item) => (
        <div key={item.id} style={styles.card}>
           {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt={item.name}
              style={styles.image}
            />
          )}
          <h3>{item.name}</h3>
          <p>{item.price} Kyats</p>
          <button onClick={() => addToCart(item)} style={styles.button}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
      </ul>
    </div> 
    </main>
  </div>
);

}

export default Home;
