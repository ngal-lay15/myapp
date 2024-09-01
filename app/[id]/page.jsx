"use client";

import Header from '../components/Header';
import Footer from '../components/Footer';
import '../../globals.css'

const Home = ({params}) => (
  <div >
    <Header params={params.id} />
    <Footer />
  </div>
);

export default Home;
