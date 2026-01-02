---
public: true
title: Checksum
date: '2025-12-27'
category: Blockchain
tags: [Blockchain]
excerpt: >-
  Checksum

   What is checksum ?

  A checksum is small-sized block of data derived from block of digital data for
  the purpose of deecting errors tah m...
---
# Checksum

## What is checksum ?

A checksum is small-sized block of data derived from block of digital data for the purpose of deecting errors tah may have been introduced during its transmission or storage. By themselves, checksums are often used to verify data integrity but are not relied upon to verify data authenticity.

> The procedure which generates this checksum is called a checksum function or checksum algorithm. - Wikipedia

![https://velog.velcdn.com/images%2Fasap0208%2Fpost%2F9c511980-dada-46e7-b0cc-f97143bcc6da%2Fimage.png](https://velog.velcdn.com/images%2Fasap0208%2Fpost%2F9c511980-dada-46e7-b0cc-f97143bcc6da%2Fimage.png)

## Example

0x25 = 370x62 = 980x3F = 630x52 = 82

1.  0x25 + 0x62 + 0x3F + 0x52 = 0x118(280)-> 0001 0001 10002) drop carry nibble-> 0001 10003) 2's complements-> 1110 0111(1's complements) + 1-> 1110 10004) to Hex-> 0xE8 (=Checksum byte)

### Test

1.  0x118(origin) + 0xE8(checksum) = 0x200(5122) to binary-> 0010 0000 00003) drop carry nibble-> 0000 0000
