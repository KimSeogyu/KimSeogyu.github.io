# 비트 연산 활용

## 종류

<table class="tb-2" >
	<thead>
		<tr class="bg">
			<th>비트 연산자</th>
			<th>설명</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>&amp;</td>
			<td>대응되는 비트가 모두 1이면 1을 반환함. (비트 AND 연산)</td>
		</tr>
		<tr>
			<td>|</td>
			<td>대응되는 비트 중에서 하나라도 1이면 1을 반환함. (비트 OR 연산)</td>
		</tr>
		<tr>
			<td>^</td>
			<td>대응되는 비트가 서로 다르면 1을 반환함. (비트 XOR 연산)</td>
		</tr>
		<tr>
			<td>~</td>
			<td>비트를 1이면 0으로, 0이면 1로 반전시킴. (비트 NOT 연산, 1의 보수)</td>
		</tr>
		<tr>
			<td>&lt;&lt;</td>
			<td>명시된 수만큼 비트들을 전부 왼쪽으로 이동시킴. (left shift 연산)</td>
		</tr>
		<tr>
			<td>&gt;&gt;</td>
			<td>부호를 유지하면서 지정한 수만큼 비트를 전부 오른쪽으로 이동시킴. (right shift 연산)</td>
		</tr>
		<tr>
			<td>&gt;&gt;&gt;</td>
			<td>지정한 수만큼 비트를 전부 오른쪽으로 이동시키며, 새로운 비트는 전부 0이 됨.</td>
		</tr>
	</tbody>
</table>

## 종류 별 예시

![](http://www.tcpschool.com/lectures/img_php_bitwise_and.png)
![](http://www.tcpschool.com/lectures/img_php_bitwise_or.png)
![](http://www.tcpschool.com/lectures/img_php_bitwise_xor.png)
![](http://www.tcpschool.com/lectures/img_php_bitwise_not.png)

## 비트마스크

<table>
<thead>
<tr>
<td>
    연산
</td>
<td>
    사용 예시
</td>
</tr>
</thead>
<tbody>
<tr>
</tr>
<tr>
<td>
    i번째 요소 조회하기
</td>
<td >

```
// 10 & (1 << 2)
// 1010 & 0100
// => 0000
// 결과값의 idx=3 요소는 i번째 요소의 존재여부를 나타낸다 
n & (1 << i);
```

</td>
</tr>
<tr>
<td>
    변경(삽입)
</td>
<td>

```
// 10 | (1 << 2)
// 1010 | 0100
// => 1110
// 결과값의 idx=2 요소를 1로 만들었다
n | (1 << i)
```

</td>
</tr>
<tr>
<td>
    삭제
</td>
<td>

```
// 15 & ~(1 << 2) 
// 1111 & ~0100
// 1111 & 1011
// => 1011
// 결과값의 idx=2 요소를 0으로 만들었다
n & ~(1 << i)
```

</td>
</tr>
<tr>
<td>
공집합
</td>
<td>

```
int result = 0;
```

</td>
</tr>
<tr>
<td>
꽉 찬 집합
</td>
<td>

```
// A개의 원소를 가진 집합의 종류
// 점화식으로는 (2**n) - 1
int result = ((1 << A) - 1);
```

</td>
</tr>
<tr>
<td>
최소 원소 찾기
</td>
<td>

```
int firstBit = b & -b;
```
</td>
</tr>
<tr>
<td>
최소 원소 지우기
</td>
<td>

```
int removed = origin & (origin-1);
```
</td>
</tr>
<tr>
<td>
부분 집합 순회
</td>
<td>

```
집합 A의 부분집합 순회
for (int i = A;; i = ((i - 1) & A)) {
    ...
}
```
</td>
</tr>
</tbody>
</table>

## 참고 문서

- [비트마스크](https://hongjuzzang.github.io/bitmask/bit_mask/#-%EB%B9%84%ED%8A%B8%EB%A7%88%EC%8A%A4%ED%81%AC)