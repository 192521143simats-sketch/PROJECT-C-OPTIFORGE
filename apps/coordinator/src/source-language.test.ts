import {describe,it,expect} from "vitest";
import {sourceLanguageMismatch} from "./source-language.js";
describe("foreign-language source admission",()=>{
  it.each([
    ["python","int main(void){return 0;}","C"],
    ["c","def total():\n    return 42\n","PYTHON"],
    ["c","class Invoice { public static void main(String[] args) {} }","JAVA"],
    ["java","def total()\n    return 42\n","PYTHON"],
  ] as const)("explains foreign declarations for %s",(selected,source,detected)=>{expect(sourceLanguageMismatch(selected,source)).toContain(`${detected} declarations`);});
  it.each([
    ["python",'text = "int main(void){return 0;}"\nprint(text)'],
    ["python",'"""class Invoice { }"""\ndef invoice(): return 42'],
    ["c",'/* def invoice(): */ int main(void){return 0;}'],
    ["java",'// def invoice():\nclass Invoice { String text="int main(void){}"; }'],
    ["python","print(42)"],
    ["c","typedef int number; number main(void){return 0;}"],
    ["c","enum Color { RED, BLUE }; int main(void){return RED;}"],
    ["java","public class Main<T> { public static void main(String[] args) {} }"],
    ["java","record Invoice(int amount) { public static void main(String[] args) {} }"],
    ["c","typedef int def; def invoice(void){return 0;}"],
    ["c","typedef int record; record invoice(int x){return x;}"],
    ["c","typedef int interface; interface total(void){return 0;} int main(void){return total();}"],
  ] as const)("leaves real compiler authoritative for %s",(selected,source)=>expect(sourceLanguageMismatch(selected,source)).toBeNull());
});
