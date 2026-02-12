"""
Script to check verification tokens stored in Redis.
Run this after registering a user to see the OTP codes.
"""
import asyncio
import redis.asyncio as aioredis


async def check_redis_tokens():
    """Check all verification tokens in Redis."""
    redis_client = await aioredis.from_url(
        "redis://localhost:6379/0",
        encoding="utf-8",
        decode_responses=True
    )
    
    try:
        print("\n" + "="*70)
        print("CHECKING VERIFICATION TOKENS IN REDIS")
        print("="*70 + "\n")
        
        # Get all verification keys
        patterns = [
            "verification:email:*",
            "verification:phone:*",
            "verification:attempts:*",
            "mfa:*"
        ]
        
        for pattern in patterns:
            print(f"\n📋 Pattern: {pattern}")
            print("-" * 70)
            
            keys = []
            async for key in redis_client.scan_iter(match=pattern):
                keys.append(key)
            
            if not keys:
                print(f"   ❌ No keys found")
                continue
            
            print(f"   ✅ Found {len(keys)} key(s)\n")
            
            for key in keys:
                value = await redis_client.get(key)
                ttl = await redis_client.ttl(key)
                
                # Parse the value to extract token and user_id
                if value and ':' in value:
                    token, user_id = value.split(':', 1)
                else:
                    token = value
                    user_id = None
                
                print(f"   🔑 Key: {key}")
                print(f"   🔢 OTP CODE: {token}")
                if user_id:
                    print(f"   👤 User ID: {user_id}")
                
                if ttl > 0:
                    minutes = ttl // 60
                    seconds = ttl % 60
                    print(f"   ⏰ TTL: {minutes}m {seconds}s")
                elif ttl == -1:
                    print(f"   ⏰ TTL: No expiration")
                else:
                    print(f"   ⏰ TTL: Expired")
                    
                print()
        
        # Check total keys in Redis
        db_size = await redis_client.dbsize()
        print("\n" + "="*70)
        print(f"Total keys in Redis DB: {db_size}")
        print("="*70 + "\n")
        
        # Show sample of all keys to debug
        print("\n📋 SAMPLE OF ALL KEYS IN REDIS (first 20):")
        print("-" * 70)
        count = 0
        async for key in redis_client.scan_iter(match="*"):
            print(f"   {count+1}. {key}")
            count += 1
            if count >= 20:
                break
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await redis_client.aclose()


if __name__ == "__main__":
    asyncio.run(check_redis_tokens())
