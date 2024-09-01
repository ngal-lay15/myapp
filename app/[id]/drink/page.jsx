"use client";

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import logo from '../../../img/logo.png';
import '../../../globals.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useCart } from '../../../CartContext';
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { useRouter, useSearchParams } from 'next/navigation';

// Custom hook to retrieve data from a subcollection with category filter
function useFirestoreSubcollection(parentCollection, parentId, subcollectionName, category, itemId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe;
    if (itemId) {
      // Query for a specific item based on the id
      const itemDocRef = doc(db, parentCollection, parentId, subcollectionName, itemId);
      unsubscribe = onSnapshot(
        itemDocRef,
        (doc) => {
          if (doc.exists()) {
            setData([{ id: doc.id, ...doc.data() }]);
          } else {
            setData([]); // No data if the document doesn't exist
          }
          setLoading(false);
        },
        (error) => {
          setError(error.message);
          setLoading(false);
        }
      );
    } else {
      // Default query when no itemId is present
      const parentDocRef = doc(db, parentCollection, parentId); // Reference to the parent document
      const subcollectionRef = collection(parentDocRef, subcollectionName); // Reference to the subcollection

      // Create a query to filter by category
      const orderedQuery = query(
        subcollectionRef,
        where('category', '==', category) // Filter for category
      );

      unsubscribe = onSnapshot(
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
    }

    // Cleanup listener on unmount
    return () => unsubscribe && unsubscribe();
  }, [parentCollection, parentId, subcollectionName, category, itemId]);

  return { data, loading, error };
}

const Home = ({ params }) => {
  const styles = {
    container: {
      display: 'flex',
      flexWrap: 'wrap',
// Centering items
      gap: '24px',
      marginTop: '80px',
      padding: '0 20px', // Padding for responsiveness
    },
    card: {
      border: '1px solid #eaeaea',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
      transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      textAlign: 'center',
      position: 'relative',
      width: '260px',
    },
    image: {
      width: '200px',
      height: '200px',
      marginTop:'10px'
    },
    info: {
      padding: '5px',
    },
    title: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#333',
      margin: '0 0 8px',
    },
    price: {
      fontSize: '15px',
      margin: '0 0 16px',
    },
    button: (stockStatus) => ({
      padding: '5px 10px',
      marginBottom:'10px',
      backgroundColor: stockStatus === 'Off' ? '#999' : 'orange', // Gray for out of stock, green for available
      color: 'white',
      border: 'none',
      borderRadius: '50px',
      cursor: stockStatus === 'Off' ? 'not-allowed' : 'pointer',
      fontSize: '15px',
      transition: 'background-color 0.3s ease', // Smooth transition for hover effect
    }),
    buttonHover: (stockStatus) => ({
      backgroundColor: stockStatus === 'Off' ? '#999' : '#218838', // Darker green on hover
    }),
    newLabel: {
      position: 'absolute',
      top: '10px',
      left: '10px',
      backgroundColor: '#FF5722', // Bright orange for "New" label
      color: 'white',
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '700',
    },
    cardHover: {
      transform: 'translateY(-5px)', // Lift card on hover
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)', // Stronger shadow on hover
    },
  };

  const { dispatch } = useCart();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('id');

  // Use the updated hook with itemId check
  const { data: itemData, loading, error } = useFirestoreSubcollection("1", "products", "items", "Drink", itemId);

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
      <Header style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000 }} params={params.id} />
      <main style={{ marginTop: '70px' }}>
        <div style={styles.container}>
          {itemData.map((item) => {
            const isNew = item.createdAt && (new Date() - new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt)) <= 3600000;

            return (
              <div
                key={item.id}
                style={styles.card}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, styles.cardHover);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, styles.card);
                }}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={styles.image}
                  />
                )}
                <div style={styles.info}>
                  <p style={styles.title}>{item.name}</p>
                  <p style={styles.price}>{item.price} Kyats</p>
                  <button
                    onClick={() => addToCart(item)}
                    style={styles.button(item.stock)}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover(item.stock))}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, styles.button(item.stock))}
                    disabled={item.stock === 'Off'}
                  >
                    {item.stock === 'Off' ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  {isNew && <div style={styles.newLabel}>New</div>}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Home;
