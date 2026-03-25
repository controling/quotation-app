<template>
  <div class="quote-cart">
    <van-divider>检测池 ({{ cartStore.cartCount }} 项)</van-divider>

    <van-empty v-if="cartStore.cartItems.length === 0" description="检测池为空，请从项目库中选择检测项目" />

    <div v-else>
      <!-- Mobile card view -->
      <div class="cart-mobile">
        <van-swipe-cell v-for="item in cartStore.cartItems" :key="item.id">
          <van-cell-group>
            <van-cell :title="item.name" :label="item.standard">
              <template #value>
                <div class="cart-item-right">
                  <span class="subtotal">¥{{ (item.unit_price * item.quantity).toFixed(2) }}</span>
                </div>
              </template>
              <template #label>
                <div>{{ item.category }}</div>
                <div class="cart-controls">
                  <span>单价: ¥</span>
                  <van-field
                    v-model.number="item.unit_price"
                    type="number"
                    class="price-input"
                    @update:model-value="v => cartStore.updateCartItemPrice(item.id, Number(v))"
                  />
                  <van-stepper
                    v-model="item.quantity"
                    :min="1"
                    :max="999"
                    @change="v => cartStore.updateCartItemQuantity(item.id, v)"
                  />
                </div>
              </template>
            </van-cell>
          </van-cell-group>
          <template #right>
            <van-button square type="danger" text="移除" style="height:100%" @click="cartStore.removeFromCart(item.id)" />
          </template>
        </van-swipe-cell>
      </div>

      <!-- Desktop table view -->
      <div class="cart-desktop">
        <table class="desktop-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>检测项目</th>
              <th>标准</th>
              <th>单价(元)</th>
              <th>数量</th>
              <th>小计(元)</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in cartStore.cartItems" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td>{{ item.name }}</td>
              <td class="text-wrap">{{ item.standard }}</td>
              <td>
                <van-field
                  v-model.number="item.unit_price"
                  type="number"
                  class="table-price-input"
                  @update:model-value="v => cartStore.updateCartItemPrice(item.id, Number(v))"
                />
              </td>
              <td>
                <van-stepper
                  v-model="item.quantity"
                  :min="1"
                  :max="999"
                  @change="v => cartStore.updateCartItemQuantity(item.id, v)"
                />
              </td>
              <td class="price">¥{{ (item.unit_price * item.quantity).toFixed(2) }}</td>
              <td>
                <van-button size="mini" type="danger" @click="cartStore.removeFromCart(item.id)">删除</van-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Total -->
      <div class="cart-total">
        <van-cell title="合计金额" :value="'¥' + cartStore.cartTotal.toFixed(2)" class="total-cell" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useQuotationsStore } from '../stores/quotations'

const cartStore = useQuotationsStore()
</script>

<style scoped>
.quote-cart {
  background: #fff;
  border-radius: 8px;
  margin: 12px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.cart-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.subtotal {
  color: #ee0a24;
  font-weight: 600;
  font-size: 15px;
}

.cart-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.price-input {
  width: 70px !important;
  padding: 2px 4px !important;
  border: 1px solid #ebedf0;
  border-radius: 4px;
}

.cart-desktop {
  display: none;
}

.cart-total {
  margin-top: 12px;
}

.total-cell :deep(.van-cell__title) {
  font-weight: 600;
  font-size: 16px;
}

.total-cell :deep(.van-cell__value) {
  color: #ee0a24;
  font-weight: 700;
  font-size: 18px;
}

.table-price-input {
  width: 80px !important;
  padding: 2px !important;
}

.text-wrap {
  max-width: 200px;
  word-break: break-all;
  font-size: 12px;
}

.price {
  color: #ee0a24;
  font-weight: 600;
}

@media (min-width: 768px) {
  .cart-mobile {
    display: none;
  }

  .cart-desktop {
    display: block;
    overflow-x: auto;
  }
}
</style>
