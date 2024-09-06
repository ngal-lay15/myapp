"use client";
import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { useCart } from '../../../CartContext';
import { collection, addDoc, serverTimestamp ,doc,getDoc} from "firebase/firestore";
import { db } from '../../firebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation'; 


function isPointInPolygon(point, polygon) {
  let isInside = false;
  let minX = polygon[0].latitude,
    maxX = polygon[0].latitude;
  let minY = polygon[0].longitude,
    maxY = polygon[0].longitude;

  for (let i = 1; i < polygon.length; i++) {
    const p = polygon[i];
    minX = Math.min(p.latitude, minX);
    maxX = Math.max(p.latitude, maxX);
    minY = Math.min(p.longitude, minY);
    maxY = Math.max(p.longitude, maxY);
  }

  if (
    point.latitude < minX ||
    point.latitude > maxX ||
    point.longitude < minY ||
    point.longitude > maxY
  ) {
    return false;
  }

  let i = 0,
    j = polygon.length - 1;
  for (i, j; i < polygon.length; j = i++) {
    if (
      polygon[i].longitude > point.longitude !==
        polygon[j].longitude > point.longitude &&
      point.latitude <
        ((polygon[j].latitude - polygon[i].latitude) *
          (point.longitude - polygon[i].longitude)) /
          (polygon[j].longitude - polygon[i].longitude) +
          polygon[i].latitude
    ) {
      isInside = !isInside;
    }
  }

  return isInside;
}



const Home = ({ params }) => {
  const { cart, dispatch } = useCart();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [error, setError] = useState(null);
  const [specialLocationPolygon, setspecialLocationPolygon] = useState(null);

  const [showAlert, setShowAlert] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('0');


  const [showModal, setShowModal] = useState(false); // State for showing the modal

  const router = useRouter(); // Router for navigation


  const handleModalConfirm = () => {
    setShowModal(false);
    router.push('/0/food'); // Replace with your actual route
  };

  const handleModalCancel = () => {
    setShowModal(false);
  };

  
  async function fetchLocationData() {
    const docRef = doc(db, "1", "location"); // Correct path with even segments
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const locationData = docSnap.data().location; // Adjust based on your data structure
        console.log(locationData);
        return locationData;
    } else {
        console.log("No such document!");
    }
}

fetchLocationData().then(location => {
    // Process your location data here
    if (location) {
      setspecialLocationPolygon(JSON.parse(location));
        console.log(specialLocationPolygon);
    }
});

const checkLocation = (itemLocation) => {
  return isPointInPolygon(itemLocation, specialLocationPolygon);
};

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          setError(err.message);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  }, []);

  const [takeAway, setTakeAway] = useState(() => {
    const initialState = {};
    cart.forEach((_, index) => {
      initialState[index] = false;
    });
    return initialState;
  });

  const [quantities, setQuantities] = useState(() => {
    const initialQuantities = {};
    cart.forEach((_, index) => {
      initialQuantities[index] = 1; // Start with quantity 1 for each item
    });
    return initialQuantities;
  });

  const totalPrice = cart.reduce((acc, item, index) => acc + Number(item.price) * (quantities[index] || 1), 0);

  const handleTakeawayChange = (index) => {
    setTakeAway(prevState => ({
      ...prevState,
      [index]: !prevState[index]
    }));
  };

  const handleQuantityChange = (index, change) => {
    setQuantities(prevQuantities => {
      const newQuantity = (prevQuantities[index] || 1) + change;
      return {
        ...prevQuantities,
        [index]: Math.max(newQuantity, 1) // Ensure quantity is at least 1
      };
    });
  };

  const handleSaveOrder = async () => {
    setLoading(true);

    if (params.id == 0) {
        setShowAlert(true); // Show alert box for phone and address
    } else {
        if (!checkLocation(location)) {
            await saveOrder();
        } else {
            // alert(JSON.stringify(specialLocationPolygon))
            setShowModal(true); // Show modal for outside location
        }
    }

    setLoading(false);
};

const saveOrder = async () => {
  try {
      const orderData = {
          table: params.id,
          location: location || "Unknown",
          orderlist: cart.map((item, index) => ({
              id: item.id,
              name: item.name,
              price: Number(item.price),
              quantity: quantities[index],
              takeAway: takeAway[index] ? 1 : 0,
          })),
          totalPrice: totalPrice,
          createdAt: serverTimestamp(),
          phone: phone,
          address: address,
          pickupTime: pickupTime, // Include pickup time
          deliveryOption: deliveryOption, // Include delivery option
      };

      await addDoc(collection(db, '1/order/items'), orderData);
      dispatch({ type: 'CLEAR_CART' });

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      // Reset fields after saving
      setPhone('');
      setAddress('');
      setPickupTime('');
      setDeliveryOption('0'); // Reset to default
      setShowAlert(false); // Close alert box
  } catch (error) {
      console.error("Error saving order: ", error);
      alert("Failed to save the order. Please try again.");
  }
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
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '2px solid #ddd' }}>Quantity</th>
              <th style={{ textAlign: 'center', padding: '8px', borderBottom: '2px solid #ddd' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, index) => (
              <tr key={`${item.id}-${index}`}>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd' }}>{item.name}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                  {(Number(item.price) * (quantities[index] || 1)).toFixed(2)}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                  <input
                    type="checkbox"
                    checked={takeAway[index] || false}
                    onChange={() => handleTakeawayChange(index)}
                  />
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>
                  <button
                    onClick={() => handleQuantityChange(index, -1)}
                    disabled={quantities[index] <= 1}
                    style={{ marginRight: '5px' }}
                  >
                    -
                  </button>
                  {quantities[index]}
                  <button
                    onClick={() => handleQuantityChange(index, 1)}
                    style={{ marginLeft: '5px' }}
                  >
                    +
                  </button>
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
            backgroundColor: 'orange',
            color: '#000000',
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

        {/* {checkLocation(location) ? "Inside Special Location" : "Outside Special Location"} */}

         {/* Modal for outside location */}
         {showModal && (
  <div
    style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#e6f7ff', // Light blue background
      padding: '30px',
      borderRadius: '10px',
      boxShadow: '0 8px 16px rgba(0, 0, 255, 0.2)', // Blue shadow effect
      zIndex: 1001,
    }}
  >
    <p style={{ color: '#003366', fontWeight: 'bold', fontSize: '16px' }}>
      လူကြီးမင်း၏ Device မှာ ဆိုင်အတွင်းမရှိပါသဖြင့် online မှ Cash On Delivery စနစ်ဖြင့်သာ မှာယူနိုင်ပါသည်။
    </p>
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
      <button
        onClick={handleModalConfirm}
        style={{
          padding: '12px 24px',
          backgroundColor: '#0056b3',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginRight: '10px',
        }}
      >
        မှာယူမည်
      </button>
      <button
        onClick={handleModalCancel}
        style={{
          padding: '12px 24px',
          backgroundColor: '#003366',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        နောက်သို့
      </button>
    </div>
  </div>
)}

{showAlert && (
    <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#f8f9fa', padding: '20px',
        borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        zIndex: 1001, width: '300px', textAlign: 'center'
    }}>
        <h5 style={{ marginBottom: '15px' }}> အချက်လက်များ ဖြည့်ရန်</h5>
        <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ marginBottom: '10px', width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
            required
        />
        <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ marginBottom: '10px', width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
            required
        />
        <input
            type="text"
            placeholder="Order Pickup Time"
            value={pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            style={{ marginBottom: '10px', width: '100%', padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
            required
        />
        <select
            value={deliveryOption}
            onChange={(e) => setDeliveryOption(e.target.value)}
            style={{
                marginBottom: '10px', width: '100%', padding: '8px',
                borderRadius: '5px', border: '1px solid #ccc', appearance: 'none',
                backgroundColor: '#fff', backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 16 16\' fill=\'%23000\'><polygon points=\'4 5 8 9 12 5\'/></svg>")',
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
                backgroundSize: '12px', cursor: 'pointer'
            }}
        >
            <option value="0">ကိုယ်တိုင်လာယူမည်</option>
            <option value="1">Delivery ဖြင့် ပို့ပါ</option>
        </select>
        <div>
            <button
                onClick={async () => {
                    await saveOrder();
                    setShowAlert(false);
                }}
                style={{
                    padding: '10px 15px', backgroundColor: '#007bff',
                    color: '#fff', border: 'none', borderRadius: '5px',
                    cursor: 'pointer', marginRight: '5px'
                }}
            >
                Confirm
            </button>
            <button
                onClick={() => setShowAlert(false)}
                style={{
                    padding: '10px 15px', backgroundColor: '#dc3545',
                    color: '#fff', border: 'none', borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                Cancel
            </button>
        </div>
    </div>
)}

      </main>
    </div>
  );
};

export default Home;
