"use client"
import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useCart } from '../../../CartContext';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../../firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import food from '../../../img/food.png';

const Home = ({ params }) => {
  const { cart, dispatch } = useCart();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [showToast, setShowToast] = useState(false);

  const [takeAway, setTakeAway] = useState(() => {
    const initialState = {};
    cart.forEach((_, index) => {
      initialState[index] = false;
    });
    return initialState;
  });
  

  const totalPrice = cart.reduce((acc, item) => acc + Number(item.price), 0);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        position => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        error => {
          console.error("Error getting location:", error);
          setLocation("Location not available");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      setLocation("Geolocation is not supported by this browser.");
    }
  }, []);

  const handleTakeawayChange = (index) => {
    setTakeAway(prevState => ({
      ...prevState,
      [index]: !prevState[index]
    }));
  };
  
  

  const handleSaveOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        table: params.id,
        location: location || "Unknown",
        orderlist: cart.map((item, index) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          takeAway: takeAway[index] ? 1 : 0, // Use the index to get the takeAway value
        })),
        totalPrice: totalPrice,
        createdAt: serverTimestamp(),
      };
  
      await addDoc(collection(db, '1/order/items'), orderData);
      dispatch({ type: 'CLEAR_CART' });
  
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Error saving order: ", error);
      alert("Failed to save the order. Please try again.");
    }
    setLoading(false);
  };
  
  const handleDelete = (index) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { index } });
  };

  return (
    <div>
      <Header params={params.id} />
      <main style={{ marginTop: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
        <table style={{ width: '100%', maxWidth: '800px', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #ddd' }}>Item Name</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #ddd' }}>Price (Kyats)</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #ddd' }}>Take Away</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, index) => (
              <tr key={`${item.id}-${index}`}>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{item.name}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>{Number(item.price).toFixed(2)}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                <input
          type="checkbox"
          checked={takeAway[index] || false}
          onChange={() => handleTakeawayChange(index)}
        />
                </td>
                <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ddd' }}>
                  <FontAwesomeIcon
                    icon={faTrash}
                    onClick={() => handleDelete(index)}
                    style={{ cursor: 'pointer', color: '#dc3545' }}
                    title="Delete"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '8px', borderTop: '2px solid #ddd' }}>Total Price:</td>
              <td style={{ padding: '8px', borderTop: '2px solid #ddd', textAlign: 'right' }}>{totalPrice.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>

        <button
          onClick={handleSaveOrder}
          disabled={loading || !location || showToast || cart.length === 0}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            opacity: loading || !location || showToast || cart.length === 0 ? 0.6 : 1,
            marginTop: '10px'
          }}
        >
          {loading ? "Ordering" : "Order"}
        </button>

        {showToast && (
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#28a745',
              color: '#fff',
              padding: '10px 20px',
              borderRadius: '5px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              zIndex: 1000,
            }}
          >
            Order saved successfully!
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
