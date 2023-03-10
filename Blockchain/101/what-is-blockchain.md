# 블록체인의 이해

> _보험연구원의 연구보고서 '[권호 : 18-24] 보험 산업의 블록체인 활용'을 읽고 작성한 내용입니다. 개인 공부 목적이라 정리가 미흡한 점 양해 부탁드립니다._

## 1. 블록체인의 의미

블록체인이란 P2P(Peer to Peer) 네트워크를 통해 관리되는 분산 데이터베이스의 한 형태로, 거래 정보를 담은 장부를 중앙서버 한 곳에 저장하는 것이 아니라 블록체인 네트워크에 연결된 여러 컴퓨터에 저장 및 보관하는 기술로 다양한 분야에 활용이 가능한 기술이다.

블록체인은 분산원장 기술이라고도 불리며, 이는 거래 정보를 기록한 원장 데이터를 중앙서버가 아닌 참가자들이 공동으로 기록 및 관리하는 것을 의미한다. 블록체인은 분산처리와 암호화 기술을 동시에 적용하며 높은 보안성을 확보하는 한편 거래과정의 신속성과 투명성을 특징으로 한다.

보안성의 강화로 해커의 공격과 데이터의 왜곡 그리고 기존 중앙집중 서버 방식에서 가장 큰 문제인 디도스 공격을 원천적으로 방어할 수 있다. 그리고 블록체인 플랫폼을 이용하면 제 3자의 거래에 의존하던 여러 과정들을 생략할 수 있어, 그에 따른 비용을 획기적으로 절약할 수 있다. 제 3자가 거래 중심의 보장 및 증명 서비스의 항목들을 블록체인 시스템에 수렴할 수 있다.

보안성이 높고 위변조가 어렵다는 특성 때문에 데이터 원본의 무결성이 요구되는 다양한 공공-민간 영역에 적용되고 있으며, 새로운 신뢰사회 구현의 기반 기술로 주목받고 있는 중이다. 또한, 블록체인 기술은 거래 장부인 데이터뿐 아니라 거래 계약도 중간 신뢰 담당자없이 거래를 할 수 있는데 이것이 바로 앞서 언급한 스마트계약이다.

## 2. 블록체인의 원리

블록체인 기술은 거래정보를 기록한 원장데이터를 중앙 서버가 아닌 네트워크에 참가하는 모든 공동체가 거래를 기록하고 관리하는 P2P거래를 지향하는 탈중앙화를 핵심 개념으로 하는 기술이다. 기존 금융 시스템에서는 금융회사들이 중앙 서버에 거래기록을 보관해온 반면, P2P 방식을 기반으로 하는 블록체인에서는 거래 정보를 블록에 담아 차례대로 연결하고 이를 모든 참여자가 공유한다.

-   거래과정1) A가 B에게 송금희망 등의 거래 요청을 한다.2) 핻당 거래 정보가 담긴 블록이 생성된다.3) 블록이 네트워크 상의 모든 참여자에게 전송되면4) 참여자들은 거래 정보의 유효성을 상호 검증한다.5) 참여자 과반수의 데이터와 일치하는 거래내역은 정상 장부로 확인하는 방식으로 검증이 완료된 블록은 이전 블록에 연결되고, 그 사본이 만들어져 각 사용자의 컴퓨터에 분산 저장된다.6) A가 B에게 송금하여 거래가 완료된다.

이렇게 거래할 때마다 거래 정보가 담긴 블록이 생성되어 계속 연결되면서 모든 참여자의 컴퓨터에 분산 저장되는데, 이를 해킹하여 임의로 수정하거나 위조 또는 변조하려면 전체 참여자의 과반수 이상의 거래 정보를 동시에 수정하여야 하기 때문에 사실상 불가능하다. 따라서 접근을 차단함으로써 거래 정보를 보호 및 관리하는 기존의 금융시스템과는 전혀 달리, 블록체인에서는 모든 거래 정보를 누구나 열람할 수 있도록 공개한 상태에서 은행 같은 공신력있는 제 3자의 보증 없이 당사자 간에 안전하게 거래가 이루어 진다.

## 3. 블록체인의 기술적 개념

### 가. 해시함수

블록체인, 암호화폐 기술의 내용에 매번 등장하는 것 중 하나가 해시함수이다. 해시함수의 해시는 "어떤 데이터를 고정된 길이의 데이터로 변환"하는 것을 의미한다. 해시함수를 거치면 원본 데이터를 알아볼 수 없도록 특수한 문자열로 변환이 되는데, 해시함수는 압축이 아니라 단방향 변환이기 때문에 해시값을 이용해서 원본데이터를 복원할 수 없다는 특징을 가지고 있다.

### 1) 해시함수의 유용성

해시함수는 다음과 같은 성격이 있기 때문에 보안에서 유용하게 쓰인다. 원본데이터에 아주 작은 변화만 있어도 완전이 다른 해시값이 만들어지게 된다.즉 해시함수를 이용하게 되면, 원본데이터의 사소한 변화도 쉽게 확인할 수 있게 된다. 또한 해시함수는 눈사태 효과때문에 전자서명, 증명서 등에서 해시값을 많이 활용하고 있다. 본문에 약간의 수정만 가해져도 해시값이 완전히 달라져 위변조 판별이 용이하기 때문이다. 블록체인의 해시함수가 양방향 변환이 가능했더라면 암호화에 쓰일 수가 없었을 것이다.

하지만 해시함수는 단방향 변환이며, 복원이 불가능하기 때문에 블록체인 기술 및 전자서명 등 암호화에 사용될 수 있다. 블록체인에서는 이 해시값을 이용해 해당 블록에 서명하고 이전 블록의 해시값을 다음 블록에 기록함으로써 체인 형태의 연결 리스트를 형성하게 된다. 따라서 특정 블록을 해킹하려면 그 블록에 연결된 다른 블록들도 수정을 해야하기 때문에 데이터의 위변조가 아주 어려운 구조를 가지고 있다.

### 2) 해시함수의 특성

(1) 어떤 길이의 데이터도 입력으로 사용될 수 있다.

(2) 결과는 정해진 길이로 나온다.

(3) 계산 시간이 합리적으로 추정 가능해야 한다.

(4) 결과 값이 중복될 가능성이 거의 없다.

(5) \*\*\*\*입력 값을 알 수 없다.

(6) 결과 값을 알려주고 입력 값을 찾을 수 있는 특별한 공식이 없다.

![https://velog.velcdn.com/images%2Fasap0208%2Fpost%2F0a7c3c00-b692-429b-be26-d1e25b481912%2Fimage.png](https://velog.velcdn.com/images%2Fasap0208%2Fpost%2F0a7c3c00-b692-429b-be26-d1e25b481912%2Fimage.png)

### 3) 해시함수에 관한 추가 설명

블록체인을 활용한 암호화폐에서 사용되는 암호기술은 해시함수, 전자서명, 공개키 암호화 알고리즘이라 말할 수 있다. 여기서 해시함수는 임의 데이터를 특정 길이의 문자, 숫자로 조합된 해시값으로 변환하는 암호 알고리즘의 일종이다. 해시함수에서 산출되는 해시값은 지문이라고도 하는데, 암호화폐에서 해시값 비교를 통하여 원본의 위변조 여부를 판단하는 무결성 검증에 사용될 수 있다.

블록체인에서 해시함수를 사용하는 3가지 목적을 살펴보면 첫째, 공개키의 해시값을 지갑주소로 활용하여 익명화된 거래를 수행하고, 가상화폐의 전자지갑 주소는 공개키 기반 암호화 알고리즘에서 생성된 공개키의 해시값을 사용한다. 개인정보(정확히는 송신자의 계좌정보) 없이 익명화된 거래를 통해 송금자의 신원을 감추고, 송금할 수 있다.

둘째, 해시함수를 사용하여 2가지의 무결성 검증에 사용하게 된다. 체인으로 연결된 블록헤더의 해시값을 활용하여 해시값 체인으로 연결된 블록의 무결성 검증에 사용된다. 또 다른 무결성 검증은 각 블록의 전체거래를 하나의 해시값(머클루트)으로 저장하고, 필요할 경우에는 언제든, 해당 블록의 머클루트 값으로 블록 내에 포함된 개별거래의 위변조 여부를 검증할 수 있다. 모든 거래 데이터의 해시값을 머클 트리를 이용하여 만들어지는 머클 루트에 저장하고 향후 거래내역의 위변조 여부를 검증할 때, 원본 해시값과 비교를 통하여, 각 거래의 무결성을 검증할 수 있다.또한 머클 루트는 1MB로 크기가 제한되어 있는 비트코인의 각 블록의 크기를 효율적으로 사용할 수 있게 한다. 전체 거래내역을 다 저장할 필요 없이, 머클루트라는 한 개의 해시값만 저장하면, 해당 블블록 내의 모든 거래내역의 진위를 필요할 때 비교할 수 있기 때문이다.

마지막으로 합의 알고리즘에서 PoW방식을 사용할 경우, 해시값을 활용한 채굴문제에 활용한다. 해시값을 활용한 채굴문제에 먼저 맞추는 채굴자에게 채굴권한과 보상을 제공한다. 해시캐시 문제풀이를 통한 작업증명은 채굴이라고도 하는데, 채굴자에 대한 보상을 통해, 채굴을 경장해고, 채굴자가 자율적으로 새로운 블록을 생성하도록 유도할 수 있는 원리를 가지고 있다.
