"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const Home = () => {

    const router = useRouter();

    useEffect(() => {
      router.push('/0/menu');
    }, [router]);

    return null;

};

export default Home;
