import * as tf from '@tensorflow/tfjs-node';

async function testTfjs() {
  const tensor = tf.tensor([1, 2, 3, 4]);
  const squared = tensor.square();
  const result = squared.dataSync();
  console.log('Result:', result);
}

testTfjs();
