from transformers import pipeline
import json

# Put tags/topics into list
with open('tagging/tags.json', 'r') as f:
    tags_json = json.load(f)
tags = []
for tag in tags_json.values():
    tags.extend(tag)

#Zero-Shot Classification pipeline
classifier = pipeline(
    "zero-shot-classification",
    model="syedkhalid076/DeBERTa-Zero-Shot-Classification",
)
sequence_to_classify = """Preamble Whereas Parliament recognizes that a direct causal link exists between alcohol consumption and the development of fatal cancers; Whereas, in light of the serious public health risks posed by alcohol consumption, the public must have accurate and current health information relating to alcohol consumption to make informed decisions about consuming alcohol; And whereas affixing a warning label to alcoholic beverages is an effective way of making consumers aware of this health information; Now, therefore, His Majesty, by and with the advice and consent of the Senate and House of Commons of Canada, enacts as follows: R.‍S.‍, ch. F-27 Food and Drugs Act 1 The Food and Drugs Act is amended by adding the following after section 5: Alcoholic beverages — warning Start of inserted block 5.‍1 No person shall sell a beverage that contains 1.‍1 per cent or more alcohol by volume unless the package in which it is sold bears, in the prescribed form and manner, a label warning against the risks of alcohol consumption to the health of consumers and showing, in addition to any other prescribed information, (a) the volume of beverage that, in the opinion of the Department, constitutes a standard drink; (b) the number of standard drinks in the package; (c) the number of standard drinks that, in the opinion of the Department, should not be exceeded in order to avoid significant health risks; and (d) a message from the Department that sets out the direct causal link between alcohol consumption and the development of fatal cancers."""
output = classifier(sequence_to_classify, tags, multi_label=True)

# Print results
for label, score in zip(output['labels'], output['scores']):
    print(f"{label}: {score:.4f}")
