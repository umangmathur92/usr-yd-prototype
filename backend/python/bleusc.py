from nltk.translate.bleu_score import sentence_bleu
import sys

print('#Hello from python#')

sentence1 = sys.argv[1]
sentence2 = sys.argv[2]
sentence1 = sentence1.split(' ')
sentence2 = sentence2.split(' ')

reference = [sentence1]
score = sentence_bleu(reference, sentence2)
print('##  The BLEU score is: ',score)
