/* global window */
import React, { useState, useEffect, useCallback } from "react";

import DeckGL from '@deck.gl/react';
import {Map} from 'react-map-gl';

import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import {TripsLayer} from '@deck.gl/geo-layers';
import {IconLayer, ScatterplotLayer} from "@deck.gl/layers";

import Slider from "@mui/material/Slider";
import "../css/trip.css";

/* ============================================
   조명 및 재질 설정
============================================ */
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 2.0,
  position: [-74.05, 40.7, 8000]
});

const lightingEffect = new LightingEffect({ambientLight, pointLight});

const material = {
  ambient: 0.1,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [60, 64, 70]
};

const material2 = {
  ambient: 0.3,
  diffuse: 0.6,
  shininess: 32,
  specularCol: [60, 64, 70]
};

/* ============================================
   기본 테마 설정
============================================ */
const DEFAULT_THEME = {
  buildingColor: [228, 228, 228],
  buildingColor2: [255, 255, 255],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material,
  material2,
  effects: [lightingEffect]
};

/* ============================================
   초기 지도 상태 설정
============================================ */
const INITIAL_VIEW_STATE = { 
  // 가천대 글로벌캠퍼스로 위치 변경
  longitude: 127.128846, // 126.98 , -74
  latitude: 37.450724, // 37.57 , 40.72
  zoom: 15,
  pitch: 30,
  bearing: 0
};


/* ============================================
상수 및 헬퍼 함수
============================================ */
const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};
// mapbox 스타일 변경
// 최소, 최대 시간 설정 (min ~ max)
const minTime = 600; // min
const maxTime = 1090; // max

const animationSpeed = 0.1;
const mapStyle = "mapbox://styles/doyeonryu/clxa4e4wo01ox01rb7yhw4pg3";

const MAPBOX_TOKEN = `pk.eyJ1IjoiZG95ZW9ucnl1IiwiYSI6ImNsdWpjN2hsNTBkeHcycG51NWt0dWZpemMifQ.ZMBCEwB4IVUT4X2RYbjT-A`;

// 애니메이션 시간 업데이트
const returnAnimationTime = (time) => {
    if (time > maxTime) {
      return minTime;
    } else {
      return time + 0.01 * animationSpeed;
    }
  };
  
  // 시간 값을 0으로 채우는 함수 (ex. 08:05 형식으로 표시)
  const addZeroFill = (value) => {
    const valueString = value.toString();
    return valueString.length < 2 ? "0" + valueString : valueString;
  };
  
  // 시간을 시/분 형식으로 변환
  const returnAnimationDisplayTime = (time) => {
    const hour = addZeroFill(parseInt((Math.round(time) / 60) % 24));
    const minute = addZeroFill(Math.round(time) % 60);
    return [hour, minute];
  };
  
  // 현재 애니메이션 시간에 활성화된 데이터 필터링
  const currData = (data, time) => {
    const arr = [];
    data.forEach((v) => {
      const timestamp = v.timestamp;
      const s_t = timestamp[0];
      const e_t = timestamp[timestamp.length - 1];
      if (s_t <= time && e_t >= time) {
        arr.push(v);
      }
    });
    return arr;
  };

/* ============================================
   메인 컴포넌트: Trip
============================================ */
const Trip = (props) => {
  // 애니메이션 시간을 관리하는 상태
  const [time, setTime] = useState(minTime); // 현재 시간을 상태로 관리 (애니메이션 동기화)
  const [animation] = useState({}); // 애니메이션 ID를 저장할 객체 상태

  // 부모(APP.JS)로부터 전달받은 데이터
  const trip_car = props.trip_car; // 차량 경로 데이터
  const trip_foot = props.trip_foot; // 도보 경로 데이터
  const stop = props.stop; // 정류장 데이터
  const point_car = currData(props.point_car, time); // 현재 시간에 해당하는 차량 포인트 필터링
  // const point_car = props.point_car;
  // const trip = currData(props.trip, time);

  // 애니메이션 업데이트 함수
  const animate = useCallback(() => {
    setTime((time) => returnAnimationTime(time)); // 현재 시간을 업데이트
    animation.id = window.requestAnimationFrame(animate); // 다음 프레임 요청
  }, [animation]);

  // 컴포넌트가 렌더링될 때 애니메이션 시작
  useEffect(() => {
    animation.id = window.requestAnimationFrame(animate); // 애니메이션 시작
    return () => window.cancelAnimationFrame(animation.id); // 컴포넌트가 언마운트될 때 애니메이션 정지
  }, [animation, animate]);

  /* ============================================
     레이어 설정
  ============================================ */
  const layers = [
    // 정류장 아이콘 레이어
    new IconLayer({
      id: "location", // 레이어 ID
      data: stop, // 데이터 소스 (정류장 좌표)
      sizeScale: 7, // 아이콘 크기 조정
      iconAtlas: "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png", // 아이콘 이미지 경로
      iconMapping: ICON_MAPPING, // 아이콘 매핑 정보
      getIcon: d => "marker", // 아이콘 이름
      getSize: 2, // 아이콘 크기
      getPosition: d => d.coordinates, // 정류장 좌표
      getColor: [255, 0, 0], // 아이콘 색상 (빨강)
      opacity: 1, // 투명도
      mipmaps: false, 
      pickable: true, // 마우스 인터랙션 허용
      radiusMinPixels: 2, // 최소 픽셀 크기
      radiusMaxPixels: 2, // 최대 픽셀 크기
    }),

    // 차량 경로 레이어
    new TripsLayer({  
      id: 'trips_car', // 레이어 ID
      data: trip_car, // 데이터 소스 (차량 경로)
      getPath: d => d.route, // 차량 경로 데이터
      getTimestamps: d => d.timestamp, // 타임스탬프
      getColor: [255, 255, 0], // 차량 경로 색상 (노랑)
      opacity: 1, // 투명도
      widthMinPixels: 7, // 경로 두께
      capRounded : true, // 경로 끝 모서리를 둥글게
      jointRounded : true, // 경로 연결 지점 둥글게
      trailLength : 0.5, // 경로의 잔상 길이
      currentTime: time, // 현재 시간
      shadowEnabled: false // 그림자 비활성화
    }),

    // 도보 경로 레이어
    new TripsLayer({  
      id: 'trips_foot', // 레이어 ID
      data: trip_foot, // 데이터 소스 (도보 경로)
      getPath: d => d.route, // 도보 경로 데이터
      getTimestamps: d => d.timestamp, // 타임스탬프
      getColor: [255, 0, 255], // 도보 경로 색상 (핑크)
      opacity: 1, // 투명도
      widthMinPixels: 7, // 경로 두께
      capRounded : true, // 경로 끝 모서리를 둥글게
      jointRounded : true, // 경로 연결 지점 둥글게
      trailLength : 0.5, // 경로의 잔상 길이
      currentTime: time, // 현재 시간
      shadowEnabled: false // 그림자 비활성화
    }),

    // 차량 포인트 레이어 (대기 중인 차량 위치)
    new ScatterplotLayer({
      id: 'scatterplot-layer', // 레이어 ID
      data: point_car, // 데이터 소스 (차량 포인트)
      getPosition: d => d.coordinates, // 포인트 좌표
      getFillColor: [255, 255, 0], // 포인트 색상 (흰색)
      getRadius: d => 3, // 포인트 반경
      getLineWidth: 3, // 테두리 두께
      radiusScale: 2, // 반경 스케일 조정
      pickable: true, // 마우스 인터랙션 허용
      opacity: 0.5, // 투명도
    }),
  ];
  
  /* ============================================
     렌더링
  ============================================ */
  const SliderChange = (value) => {
    const time = value.target.value; // 슬라이더 값 가져오기
    setTime(time); // 시간을 업데이트
  };

  // 시간을 시:분 형식으로 변환
  const [hour, minute] = returnAnimationDisplayTime(time);

  return (
    <div className="trip-container" style={{ position: "relative" }}>
      <DeckGL
        effects={DEFAULT_THEME.effects} // 시각적 효과 추가
        initialViewState={INITIAL_VIEW_STATE} // 초기 지도 상태
        controller={true} // 지도 확대/축소/이동 허용
        layers={layers} // DeckGL에 적용할 레이어
      >
        <Map 
          mapStyle={mapStyle} // 지도 스타일
          mapboxAccessToken={MAPBOX_TOKEN} // Mapbox 액세스 토큰
          preventStyleDiffing={true} // 스타일 변경 방지
        />
      </DeckGL>
      <h1 className="time">TIME : {`${hour} : ${minute}`}</h1>
      {/* 현재 애니메이션 시간을 표시 */}
      <Slider
        id="slider" // 슬라이더 ID
        value={time} // 현재 슬라이더 값
        min={minTime} // 슬라이더 최소값
        max={maxTime} // 슬라이더 최대값
        onChange={SliderChange} // 슬라이더 값 변경 이벤트 핸들러
        track="inverted" // 슬라이더 스타일 (반전)
      />
    </div>
  );
};

export default Trip; // Trip 컴포넌트 내보내기
