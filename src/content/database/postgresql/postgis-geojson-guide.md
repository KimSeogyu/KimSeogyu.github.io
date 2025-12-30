---
public: true
title: PostGIS와 GeoJSON을 활용한 공간 데이터 관리
date: '2025-12-30'
category: Database
tags: [PostGIS, PostgreSQL, GeoJSON, Spatial, GIS]
excerpt: "PostGIS에서 GeoJSON 형식의 공간 데이터를 저장, 변환, 조회하는 핵심 함수와 인덱싱 전략을 알아봅니다."
---
# PostGIS와 GeoJSON을 활용한 공간 데이터 관리

## 개요

**PostGIS**는 PostgreSQL의 공간 확장으로, 지리 데이터를 저장하고 쿼리할 수 있습니다. **GeoJSON**은 지리 정보를 표현하는 JSON 기반 표준(RFC 7946)입니다.

## 테이블 설계

### 기본 공간 테이블

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    -- SRID 4326 = WGS84 (위경도)
    geom GEOMETRY(MultiPolygon, 4326)
);

-- 공간 인덱스 필수
CREATE INDEX idx_regions_geom ON regions USING GIST(geom);
```

### SRID 선택

| SRID | 좌표계 | 용도 |
|------|--------|------|
| 4326 | WGS84 위경도 | GeoJSON 표준, GPS |
| 3857 | Web Mercator | 웹 지도 타일 |
| 5186 | Korea TM | 한국 측량 |

## GeoJSON → PostGIS 저장

### ST_GeomFromGeoJSON

GeoJSON 문자열을 Geometry로 변환:

```sql
-- 단일 폴리곤 삽입
INSERT INTO regions (name, geom)
VALUES (
    '서울시',
    ST_GeomFromGeoJSON('{
        "type": "Polygon",
        "coordinates": [[[126.9, 37.5], [127.1, 37.5], [127.1, 37.6], [126.9, 37.6], [126.9, 37.5]]]
    }')
);

-- SRID 명시 (PostGIS 3.0+는 기본 4326)
INSERT INTO regions (name, geom)
VALUES (
    '부산시',
    ST_SetSRID(ST_GeomFromGeoJSON('{"type": "Polygon", "coordinates": ...}'), 4326)
);
```

### 배치 삽입

```sql
-- JSON 배열에서 일괄 삽입
INSERT INTO regions (name, geom)
SELECT 
    feature->>'name',
    ST_GeomFromGeoJSON(feature->'geometry')
FROM jsonb_array_elements(:geojson_features::jsonb) AS feature;
```

## PostGIS → GeoJSON 조회

### ST_AsGeoJSON

Geometry를 GeoJSON 문자열로 변환:

```sql
-- 기본 변환
SELECT id, name, ST_AsGeoJSON(geom) AS geojson
FROM regions;

-- 좌표 소수점 6자리로 제한 (위경도 약 0.1m 정밀도)
SELECT ST_AsGeoJSON(geom, 6) FROM regions;

-- BBox 포함 (옵션 1)
SELECT ST_AsGeoJSON(geom, 6, 1) FROM regions;
```

### FeatureCollection 생성

클라이언트에 전달할 완전한 GeoJSON 생성:

```sql
SELECT json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(
        json_build_object(
            'type', 'Feature',
            'id', id,
            'geometry', ST_AsGeoJSON(geom, 6)::json,
            'properties', json_build_object('name', name)
        )
    )
) AS geojson
FROM regions;
```

## 공간 쿼리

### 포함 관계

```sql
-- 특정 좌표가 어느 지역에 속하는지
SELECT name FROM regions
WHERE ST_Contains(geom, ST_SetSRID(ST_Point(127.0, 37.5), 4326));
```

### 반경 검색

```sql
-- 반경 10km 내 지역 (Geography 타입 활용)
SELECT name, ST_Distance(geom::geography, ST_Point(127.0, 37.5)::geography) AS distance_m
FROM regions
WHERE ST_DWithin(geom::geography, ST_Point(127.0, 37.5)::geography, 10000)
ORDER BY distance_m;
```

### 교차 영역

```sql
-- 두 지역의 교집합
SELECT ST_AsGeoJSON(ST_Intersection(a.geom, b.geom))
FROM regions a, regions b
WHERE a.name = '서울시' AND b.name = '경기도';
```

## 인덱스 전략

### GIST 인덱스

공간 쿼리 성능의 핵심:

```sql
-- 기본 공간 인덱스
CREATE INDEX idx_geom ON regions USING GIST(geom);

-- Geography 인덱스 (거리 계산용)
CREATE INDEX idx_geom_geog ON regions USING GIST((geom::geography));
```

### 클러스터링

자주 함께 조회되는 데이터를 물리적으로 인접 배치:

```sql
CLUSTER regions USING idx_regions_geom;
```

## 좌표계 변환

```sql
-- WGS84 → Web Mercator
SELECT ST_Transform(geom, 3857) FROM regions;

-- 면적 계산 (정확한 계산을 위해 적절한 투영 사용)
SELECT name, ST_Area(ST_Transform(geom, 5186)) AS area_m2
FROM regions;
```

## 폴리곤 유효성

```sql
-- 유효성 검사
SELECT name, ST_IsValid(geom), ST_IsValidReason(geom)
FROM regions
WHERE NOT ST_IsValid(geom);

-- 자동 수정
UPDATE regions SET geom = ST_MakeValid(geom) WHERE NOT ST_IsValid(geom);

-- GeoJSON 표준 준수 (Right-Hand Rule)
UPDATE regions SET geom = ST_ForcePolygonCCW(geom);
```

## 모범 사례

1. **SRID 4326**: GeoJSON과 호환, 웹 서비스 표준
2. **GIST 인덱스 필수**: 공간 쿼리 성능 결정
3. **좌표 정밀도 제한**: `ST_AsGeoJSON(geom, 6)`으로 불필요한 정밀도 제거
4. **유효성 검사**: 삽입 전 `ST_IsValid` 확인
5. **Geography 타입**: 거리 계산이 중요하면 Geography 사용

## 참고 자료

- [PostGIS 3.4 Documentation](https://postgis.net/docs/)
- [GeoJSON RFC 7946](https://datatracker.ietf.org/doc/html/rfc7946)
