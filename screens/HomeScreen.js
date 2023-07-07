import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../theme';
import { CalendarDaysIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { MapPinIcon } from 'react-native-heroicons/solid';
import { debounce, set, startCase } from 'lodash';
import { fetchLocations } from '../api/weather';
import { fetchWeatherForecast } from '../api/weather';
import { weatherImages } from '../constants/index';
import * as Progress from 'react-native-progress';
import { getData, storeData } from '../utils/asyncStorage';

export default function HomeScreen() {
  const [showSearch, toggleSearch] = React.useState(false);
  const [locations, setLocations] = React.useState([]);
  const [weather, setWeather] = React.useState({})
  const [loading, setLoading] = React.useState(true);


  const handleLocation = (loc) => {
    console.log("location:", loc);
    setLocations([]);
    toggleSearch(false)
    setLoading(true)
    fetchWeatherForecast({
      cityName: loc.name,
      days: '7'
    }).then(data => {
      console.log("got forecast:", data);
      setWeather(data);
      setLoading(false);
      storeData('city', loc.name)
    }).catch(error => {
      console.log("error fetching forecast:", error);
    });
  };  

  const handleSearch = value => {
    // fetch locations
    if (value.length > 2) {
      fetchLocations({cityName: value}).then(data => {
        setLocations(data);
      }).catch(error => {
        console.log("error fetching locations:", error);
      }
    );
    }
}

  useEffect(() => {
    fetchMyWeatherData();
  }, []); 

  const fetchMyWeatherData = async ()=>{
    let myCity = await getData('city')
    let cityName = 'Albuquerque'
    if(myCity) cityName = myCity
    fetchWeatherForecast({
      cityName,
      days: '7'
    }).then(data => {
      setWeather(data);
      setLoading(false);
    }).catch(error => {
      console.log("error fetching forecast:", error);
    })
  }

  const handleTextDebounce = React.useCallback(debounce(handleSearch, 1200), []);
  const {current, location} = weather;

  return (
    <View className="flex-1 relative">
      <StatusBar style="light" />
      <Image blurRadius={30} source={require('../assets/images/bg.jpg')} 
        className="absolute h-full w-full" />
      {
        loading? (
          <View className="flex-1 flex-row justify-center items-center">
            <Progress.CircleSnail thickness={10} size={40} color="#0bb3b2" />
          </View>
        ):(
          <SafeAreaView className="flex flex-1">
            {/* search bar */}
            <View style={{ height: '7%' }} className="mx-4 relative z-50" />
            <View
              className="flex-row justify-end items-center rounded-full"
              style={{ backgroundColor: showSearch? theme.bgWhite(0.2): 'transparent' }}
            >
              {showSearch? (
                <TextInput
                  onChangeText={handleTextDebounce}
                  placeholder="Search for your city"
                  placeholderTextColor={'lightgray'}
                  className="pl-6 h-10 pb-1 flex-1 text-base text-white"
                />
              ) : null}
              <TouchableOpacity
                onPress={() => toggleSearch(!showSearch)}
                style={{ backgroundColor: theme.bgWhite(0.3) }}
                className="rounded-full p-3 m-1"
              >
                <MagnifyingGlassIcon size="25" color="white" />
              </TouchableOpacity>
              {locations.length > 0 && showSearch ? (
                <View style={{ position: 'absolute', width: '100%', backgroundColor: 'gray', top: '100%', borderRadius: 16 }}>
                  {locations.map((loc, index) => (
                    <TouchableOpacity
                      onPress={() => handleLocation(loc)}
                      key={index}
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 8, borderBottomWidth: index + 1 !== locations.length ? 2 : 0, borderBottomColor: 'gray' }}
                    >
                      <MapPinIcon size={20} color="gray" />
                      <Text style={{ color: 'black', fontSize: 16, marginLeft: 8 }}>{loc?.name}, {loc?.country}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

            </View>
            {/* Forecast */}
            <View className="mx-4 flex justify-around flex-1 mb-2">
              <Text className="text-white text-center text-2xl font-bold">
                {location?.name},
              <Text className="text-lg font-semibold text-gray-300">
                  {" " + location?.country}
                </Text>
              </Text>
              {/* Weather image */}
              <View className="flex-row justify-center">
              <Image
                source={weatherImages[current?.condition?.text]}
                style={{ width: 100, height: 100 }}
              />
              </View>

              {/* Degrees Celcius */}
              <View className="space-y-2">
                <Text className="text-center font-bold text-white text-6xl ml-5">
                      {current?.temp_f}&#176;
                  </Text>                
                <Text className="text-center text-white text-xl tracking-widest">
                      {current?.condition?.text}
                  </Text>
              </View>

              {/* other stats */}
              <View className="flex-row justify-between mx-4">
                <View className="flex-row space-x-2 items-center">
                  <Image source={require('../assets/icons/wind.png')} className="h-6 w-6" />
                  <Text className="text-white font-semibold text-base">{current?.wind_mph} mph</Text>
                </View>

                <View className="flex-row space-x-2 items-center">
                  <Image source={require('../assets/icons/drop.png')} className="h-6 w-6" />
                  <Text className="text-white font-semibold text-base">{current?.humidity}%</Text>
                </View>

                <View className="flex-row space-x-2 items-center">
                  <Image source={require('../assets/icons/sun.png')} className="h-6 w-6" />
                  <Text className="text-white font-semibold text-base">
                    {weather?.forecast?.forecastday[0]?.astro?.sunrise}
                  </Text>
                </View>
              </View>
            </View>

            {/* Future Forecast */}
            <View className="mb-2 space-y-3">
              <View className="flex-row items-center mx-5 space-x-2">
                <CalendarDaysIcon size="20" color="white"/>
                <Text className="text-white text-base">7-Day Forecast</Text>
              </View>
              <ScrollView
                horizontal
                contentContainerStyle={{paddingHorizontal: 15}}
                showHorizontalScrollIndicator={false}
              >
                {
                  weather?.forecast?.forecastday?.map((item, index)=>{
                    let date = new Date(item.date)
                    let options = {weekday: 'long'}
                    let dayName = date.toLocaleDateString('en-US', options)
                    dayName = dayName.split(',')[0]
                    dayName = dayName.split(',')[0]

                    return(
                      <View
                      key={index}
                      className="flex justify-center items-center w-24 rounded-3xl py-3 space-y-1 mr-4"
                      style={{backgroundColor: theme.bgWhite(0.15)}}
                      >
                      <Image source={weatherImages[item?.day?.condition?.text]}
                        className="h-11 w-11" />
                      <Text className="text-white">{dayName}</Text>
                      <Text className="text-white text-xl font-xl font-semibold">{item?.day?.avgtemp_f}&#176;</Text>
                    </View>
                    )
                  })
                }
              </ScrollView>
            </View>
          </SafeAreaView>
        )
      }
    </View>
  );
}