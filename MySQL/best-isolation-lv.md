# Which is best isolation level for a common situation

MySQL은 데이터베이스 엔진이 동시 트랜잭션을 처리하는 방법을 정의하는 여러 분리 수준을 지원합니다. 일반적인 상황에 가장 적합한 옵션은 응용프로그램의 특정 요구사항에 따라 달라집니다.

일반적으로 REPEATABLE READ 분리 수준은 일관성과 성능 사이에서 균형을 맞추기 때문에 대부분의 응용 프로그램에 적합한 기본 옵션입니다. 그러나 응용프로그램에 더 높은 수준의 일관성이 필요한 경우에는 직렬화를 사용하는 것을 고려할 수 있습니다. 일관성보다 성능을 우선시해야 하는 경우 READ COMMITED 또는 READ UNCOMMITED를 사용하는 것을 고려할 수 있지만 잠재적인 위험과 절충점을 알고 있어야 합니다.

## ISOLATION LEVELS

- READ UNCOMMITTED: 이 격리 수준은 더티 읽기를 허용하며, 이는 트랜잭션이 다른 트랜잭션에 의해 커밋되지 않은 변경 사항을 읽을 수 있음을 의미합니다. 데이터가 일관되지 않을 수 있으므로 대부분의 응용 프로그램에는 권장되지 않습니다.

- READ COMMITTED: 이 격리 수준을 통해 트랜잭션은 커밋된 데이터만 읽을 수 있으므로 더티 읽기를 방지할 수 있습니다. 그러나 다른 트랜잭션이 읽기 간에 변경 사항을 커밋할 수 있기 때문에 계속해서 반복할 수 없는 읽기 및 팬텀 읽기가 발생할 수 있습니다.

- REPEATABLE READ: 이 격리 수준을 사용하면 다른 트랜잭션이 변경되더라도 트랜잭션이 데이터베이스의 일관된 스냅샷을 볼 수 있습니다. 반복할 수 없는 읽기 및 팬텀 읽기를 방지하지만 새 데이터를 트랜잭션에 삽입할 수 있는 작은 창을 허용합니다.

- SERIALIZABLE: 이 분리 수준은 트랜잭션이 완료될 때까지 트랜잭션이 액세스하는 모든 행을 잠궈 최고 수준의 분리를 제공합니다. 이렇게 하면 모든 형태의 동시성 관련 이상 징후를 방지할 수 있지만 동시성 및 성능이 저하될 수도 있습니다.

## REPEATABLE READ의 한계점

MySQL의 REPEATABLE READ 격리 수준은 강력한 수준의 일관성을 제공하지만 애플리케이션의 성능과 기능에 영향을 미칠 수 있는 몇 가지 제한 사항도 있습니다. 다음은 반복 가능한 읽기 분리 수준의 몇 가지 제한 사항입니다:

1. 동시성이 감소: 반복 가능 읽기 분리 수준은 트랜잭션이 완료될 때까지 트랜잭션이 액세스하는 모든 행을 잠급니다. 이로 인해 다른 트랜잭션은 잠긴 행이 해제될 때까지 기다려야 하므로 동시성이 저하될 수 있습니다.

2. 리소스 사용량 증가: 더 많은 잠금을 획득하고 해제해야 하기 때문에 REPEATABLE READ 격리 수준의 잠금 동작은 리소스 사용 증가로 이어질 수도 있습니다.

3. 일관되지 않은 읽기: REPEATABLE READ 분리 수준은 트랜잭션이 데이터베이스의 일관된 스냅샷을 볼 수 있도록 보장하지만, 격리 레벨에서는 여전히 Phantom Read라고 알려진 작은 불일치 창이 허용됩니다. 이 문제는 다른 트랜잭션이 동일한 트랜잭션 내의 첫 번째 쿼리 실행과 두 번째 쿼리 실행 사이에 첫 번째 트랜잭션에 의해 실행된 쿼리의 기준과 일치하는 새 데이터를 삽입할 때 발생할 수 있습니다.
   예를 들어 다음 두 가지 쿼리를 실행하는 트랜잭션을 생각해 보십시오:

   ```sql
   SELECT * FROM orders WHERE status = 'processing';
   -- Some time passes, during which another transaction inserts a new order with status 'processing'
   SELECT * FROM orders WHERE status = 'processing';
   ```

   트랜잭션이 REPEATABLE READ에서 실행 중인 경우, 새 주문이 그 사이에 삽입된 경우에도 두 번 모두 동일한 주문 집합을 읽습니다. 데이터베이스의 실제 상태를 반영하지 않을 수 있기 때문에 트랜잭션에서 읽은 데이터에 불일치가 발생할 수 있습니다.

   이 문제를 완화하려면 응용프로그램의 일관성을 보장하기 위해 잠금 또는 낙관적 동시성 제어와 같은 추가 메커니즘을 구현해야 할 수 있습니다. 또한 특정 실행 순서에 의존하지 않도록 쿼리 및 응용 프로그램 로직을 신중하게 설계하거나, 강력한 일관성이 필요한 경우 SERIALIZABLE와 같은 다른 분리 수준을 사용하는 것을 고려해야 할 수도 있습니다.

4. 교착 상태(Deadlocks): 반복 가능한 읽기 격리 수준은 둘 이상의 트랜잭션이 잠긴 리소스를 해제하기 위해 서로 대기하는 교착 상태로 이어질 수도 있습니다.

   이러한 제한을 완화하려면, 교착 상태의 가능성을 최소화하고 필요한 잠금 양을 줄이기 위해 응용프로그램 및 데이터베이스 스키마를 신중하게 설계해야 할 수 있습니다. 또한 응용프로그램의 특정 요구사항 및 성능 특성에 따라 READ COMMITTED 또는 SERIALIZABLE와 같은 다른 분리 수준을 사용하는 것을 고려해야 할 수도 있습니다.