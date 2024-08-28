"use client";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import logo from '../../../img/logo.png';
import '../../../globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCart } from '../../../CartContext';
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, doc, onSnapshot, query, orderBy } from "firebase/firestore";

// Custom hook to retrieve data from a subcollection
function useFirestoreSubcollection(parentCollection, parentId, subcollectionName) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const parentDocRef = doc(db, parentCollection, parentId); // Reference to the parent document
    const subcollectionRef = collection(parentDocRef, subcollectionName); // Reference to the subcollection

    // Create a query to order by createdAt
    const orderedQuery = query(subcollectionRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      orderedQuery,
      (snapshot) => {
        const fetchedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(fetchedData);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [parentCollection, parentId, subcollectionName]);

  return { data, loading, error };
}

const Home = ({ params }) => {
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
      textAlign: 'center',
    },
    image: {
      width: '200px',
      height: '150px',
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
      fontSize:'15px'
    },
  };

  const mobileStyles = {
    image: {
      width: '60px', // smaller width for mobile
      height: '50px', // smaller height for mobile
    },
    button: {
      marginTop: '8px',
      padding: '8px 16px',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize:'5px'
    },
  };

  const { dispatch } = useCart();

  // Retrieve data from subcollection "products" under document "1"
  const { data: itemData, loading, error } = useFirestoreSubcollection("1", "products", "items");

  const addToCart = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <Header params={params.id} />
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
                      style={{ ...styles.image, ...(window.innerWidth <= 900 ? mobileStyles.image : {}) }}
                    />
                  )}
                  <p>{item.name}</p>
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
};

export default Home;
