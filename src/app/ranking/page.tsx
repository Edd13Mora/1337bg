"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyledRanking } from './Styled.ranking';
import { StaticImageData } from 'next/image';
// Components
import Card from './compoents/RankCard';
import CustomDropDown from '@/components/drop_down/dropdown';
import Profile from './compoents/profile';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@mui/material';
// Types
import { Promo, Cursuse } from '@/types/FortyTwo/types';
// Data
import { Campuses } from '@/data/Campuses';
import { Cursuses } from '@/data/Cursuses';
import { Promos } from '@/data/Promos';
// Utils
import { fetchUsers } from '@/utils/fetch_users';
//Cashing
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const getCacheKey = (promoId : number, page : number) => `rankingData_${promoId}_page_${page}`;
const getCacheTimeKey = (promoId : number) => `rankingDataTimestamp_${promoId}`;


const Ranking: React.FC = () => {
    const { data: session } = useSession();
    const [FilteredProfiles, setFilteredProfiles] = useState<any[]>([]);
    const [SelectedProfile, setSelectedProfile] = useState<number>(0);
    const [selectedPromo, setSelectedPromo] = useState<number>(0);
    const [SelectedCampus, setSelectedCampus] = useState<number>(Campuses[0].id);
    const [IsInitialLoading, setIsInitialLoading] = useState<boolean>(true);
    const [IsLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [CurrentPage, setCurrentPage] = useState<number>(1);
    const [HasMore, setHasMore] = useState<boolean>(true);

    const observer = useRef<IntersectionObserver | null>(null);

    const lastProfileRef = useCallback((node: HTMLSpanElement) => {
        if (IsInitialLoading || IsLoadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && HasMore) {
                fetchMoreUsers();
            }
        });

        if (node) observer.current.observe(node);
    }, [IsInitialLoading, IsLoadingMore, HasMore]);

    const handlePromoChange = (value: string) => {
        const promoId = parseInt(value, 10);
        setSelectedPromo(promoId);
        setCurrentPage(1); // Reset current page
        setHasMore(true);  // Reset has more
    };

    const fetchMoreUsers = useCallback(async () => {
        if (session && session.accessToken && HasMore) {
            setIsLoadingMore(true);
            const PoolUrl = `https://api.intra.42.fr/v2/cursus_users?&filter[campus_id]=21&filter[begin_at]=${Promos[selectedPromo].start_date}&page[size]=100&page[number]=${CurrentPage}&sort=-level`;

            try {
                const cacheKey = getCacheKey(selectedPromo, CurrentPage);
                const cacheTimeKey = getCacheTimeKey(selectedPromo);
                const cachedData = localStorage.getItem(cacheKey);
                const cachedTimestamp = localStorage.getItem(cacheTimeKey);

                if (cachedData && cachedTimestamp && Date.now() - parseInt(cachedTimestamp) < CACHE_DURATION) {
                    const data = JSON.parse(cachedData);
                    setFilteredProfiles(prevProfiles => [...prevProfiles, ...data]);
                    setCurrentPage(prevPage => prevPage + 1);
                    setHasMore(data.length === 100);
                } else {
                    const data = await fetchUsers(PoolUrl, session.accessToken);
                    if (data.length > 0) {
                        setFilteredProfiles(prevProfiles => [...prevProfiles, ...data]);
                        setCurrentPage(prevPage => prevPage + 1);
                        localStorage.setItem(cacheKey, JSON.stringify(data));
                        localStorage.setItem(cacheTimeKey, Date.now().toString());
                        setHasMore(data.length === 100);
                    } else {
                        setHasMore(false);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoadingMore(false);
            }
        }
    }, [session, selectedPromo, CurrentPage, HasMore]);

    const initialFetchUsers = useCallback(async () => {
        if (session && session.accessToken) {
            setIsInitialLoading(true);
            const PoolUrl = `https://api.intra.42.fr/v2/cursus_users?&filter[campus_id]=21&filter[begin_at]=${Promos[selectedPromo].start_date}&page[size]=100&page[number]=1&sort=-level`;

            try {
                const data = await fetchUsers(PoolUrl, session.accessToken);
                if (data.length > 0) {
                    setFilteredProfiles(data);
                    setSelectedProfile(data[0]?.user.id); // Set to 0 if data is empty
                    setCurrentPage(2); // Start next fetch from page 2
                } else {
                    setHasMore(false);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsInitialLoading(false);
            }
        }
    }, [session, selectedPromo]);

    useEffect(() => {
        setFilteredProfiles([]); //clear profiles onChange
        initialFetchUsers();
    }, [session, selectedPromo]);

    return (
        <StyledRanking>
            <div className='Container'>
                {/* <Profile Promo={Promos[selectedPromo]} user_id={SelectedProfile} /> */}
                <div className='Ranking'>
                    <div className='Options'>
                        <div className='Filters'>
                            <div className='Select_container'>
                                <span>Promo :</span>
                                <CustomDropDown
                                    data={Promos}
                                    getValue={(item) => item.id.toString()}
                                    renderItem={(item) => item.Name}
                                    onChange={handlePromoChange}
                                />
                            </div>
                            <button disabled={true} className='ToMeButton'>Me</button>
                        </div>
                    </div>
                    <div className='Profiles_container'>
                        {!IsInitialLoading ? (
                            <>
                                {FilteredProfiles.map((profile: any, key: number) => (
                                    <Card
                                        id={profile.user.id}
                                        FullName={profile.user.usual_full_name}
                                        Level={profile.level}
                                        Rank={key + 1}
                                        UserName={profile.user.login}
                                        img={profile.user.image.versions.small}
                                        key={key}
                                        setSelectedId={setSelectedProfile}
                                    />
                                ))}
                                <span ref={lastProfileRef}>
                                    {IsLoadingMore ? 'Loading more...' : HasMore ? 'Loading more...' : 'No more users'}
                                </span>
                            </>
                        ) : (
                            <div className='Skeletons'>
                                {Array.from({ length: 8 }).map((_, key) => (
                                    <Skeleton
                                        animation={`${key % 2 ? "pulse" : "wave"}`}
                                        variant="rectangular"
                                        width="100%"
                                        height="65px"
                                        className='CardSkl'
                                        key={key}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </StyledRanking>
    );
};

export default Ranking;
